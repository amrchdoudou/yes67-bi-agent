import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, FunctionDeclaration, Tool } from '@google/genai';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const MODEL_NAME = 'gemini-3.8-flash';

// Tool Declarations for deterministic querying
const functionDeclarations: FunctionDeclaration[] = [
  {
    name: 'getTopProducts',
    description: 'Get top or bottom performing products by revenue or quantity.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        criterion: {
          type: Type.STRING,
          description: 'Sorting criterion: "revenue" or "quantity".',
        },
        direction: {
          type: Type.STRING,
          description: '"top" for highest performers, "bottom" for lowest.',
        },
        n: {
          type: Type.INTEGER,
          description: 'Number of items to retrieve (default 5).',
        },
      },
    },
  },
  {
    name: 'getRevenueAndProfit',
    description: 'Get overall revenue, gross profit, gross margin %, operating expenses, and net profit.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getAnomaliesAndAlerts',
    description: 'Get detected anomalies such as sales spikes/drops, unusual expenses, or inventory risks.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        severity: {
          type: Type.STRING,
          description: 'Filter by severity: "all", "critical", or "warning".',
        },
      },
    },
  },
  {
    name: 'getStockStatus',
    description: 'Get inventory stock health, low stock items, or overstock items.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        filter: {
          type: Type.STRING,
          description: 'Filter: "all", "low_stock", or "overstock".',
        },
      },
    },
  },
  {
    name: 'compareRegions',
    description: 'Get regional sales performance, order counts, and revenue shares.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'getMoMGrowthAndForecast',
    description: 'Get month-over-month growth rate and next-period revenue forecasts.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
];

const tools: Tool[] = [{ functionDeclarations }];

// Helper to execute tool deterministically
function executeDeterministicTool(name: string, args: any, contextData: any) {
  const kpis = contextData.kpis || {};
  const anomalies = contextData.anomalies || [];

  switch (name) {
    case 'getTopProducts': {
      const criterion = args?.criterion || 'revenue';
      const direction = args?.direction || 'top';
      const n = args?.n || 5;

      if (criterion === 'quantity') {
        return (kpis.topProductsByQuantity || []).slice(0, n);
      }
      if (direction === 'bottom') {
        return (kpis.bottomProductsByRevenue || []).slice(0, n);
      }
      return (kpis.topProductsByRevenue || []).slice(0, n);
    }
    case 'getRevenueAndProfit': {
      return {
        totalRevenue: kpis.totalRevenue,
        grossProfit: kpis.grossProfit,
        grossMarginPct: kpis.grossMarginPct,
        totalExpenses: kpis.totalExpenses,
        netProfit: kpis.netProfit,
        netMarginPct: kpis.netMarginPct,
        aov: kpis.aov,
        orderCount: kpis.orderCount,
        currency: contextData.currency || '$',
      };
    }
    case 'getAnomaliesAndAlerts': {
      const severity = args?.severity || 'all';
      if (severity === 'critical') {
        return anomalies.filter((a: any) => a.severity === 'critical');
      }
      if (severity === 'warning') {
        return anomalies.filter((a: any) => a.severity === 'warning');
      }
      return anomalies;
    }
    case 'getStockStatus': {
      const filter = args?.filter || 'all';
      const summary = kpis.inventorySummary;
      if (!summary) return { message: 'No inventory dataset loaded.' };

      if (filter === 'low_stock') {
        return (summary.items || []).filter((i: any) => (i.daysRemaining ?? 999) < 15 || i.stockQuantity <= i.minStock);
      }
      if (filter === 'overstock') {
        return (summary.items || []).filter((i: any) => (i.daysRemaining ?? 0) > 180);
      }
      return {
        totalStockUnits: summary.totalStockUnits,
        totalStockValue: summary.totalStockValue,
        stockTurnover: summary.stockTurnover,
        lowStockCount: summary.lowStockCount,
        overstockCount: summary.overstockCount,
      };
    }
    case 'compareRegions': {
      return kpis.revenueByRegion || [];
    }
    case 'getMoMGrowthAndForecast': {
      return {
        momGrowthPct: kpis.momGrowthPct,
        monthlyTrend: (kpis.revenueByMonth || []).slice(-3),
      };
    }
    default:
      return { error: `Tool ${name} not found.` };
  }
}

// 1. Endpoint: AI Executive Insights Generation
app.post('/api/ai/insights', async (req, res) => {
  try {
    const ai = getAI();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY to your Render environment variables (Dashboard > Environment).',
      });
    }

    const { companyName, currency, language = 'en', kpiSummary, anomalies, trend } = req.body;

    const langInstructions: Record<string, string> = {
      en: 'Respond in English with clear, professional executive business language.',
      fr: 'Répondez en Français avec un ton professionnel exécutif et direct.',
      ar: 'أجب باللغة العربية الفصحى بأسلوب إداري تنفيذي واستراتيجي راقٍ ومباشر.',
    };

    const prompt = `
You are the Yes67 BI Agent, a senior business intelligence advisor for SME executive leadership.
Company: "${companyName || 'SME'}" (Currency: ${currency || '$'}).

CRITICAL RULE:
All numbers below were computed deterministically by a TypeScript engine.
You must NEVER compute or invent new figures or percentages. You strictly cite values already present in the JSON.
If a figure is not present in the JSON, do not guess it.

${langInstructions[language] || langInstructions.en}

COMPUTED KPI SUMMARY:
${JSON.stringify(kpiSummary, null, 2)}

DETECTED ANOMALIES & ALERTS:
${JSON.stringify(anomalies, null, 2)}

TREND & DETERMINISTIC FORECAST:
${JSON.stringify(trend, null, 2)}
`;

    const systemInstruction = `You are a CFO-level AI Business Intelligence advisor. You analyze already-computed SME KPIs.
Output your response as JSON conforming to the requested schema.
The JSON must have keys:
- executiveSummary (string, 2-3 sentences concise synthesis quoting exact revenue and net profit)
- keyFindings (array of 3-5 strings, quoting exact numbers from the JSON)
- criticalRisks (array of 2-4 strings, identifying exact risks like stockouts, cost surges, or drops from the anomalies list)
- actionableRecommendations (array of 3-5 strings, tactical advice for SME management)
Do NOT invent numbers.`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: { type: Type.STRING },
            keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
            criticalRisks: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableRecommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['executiveSummary', 'keyFindings', 'criticalRisks', 'actionableRecommendations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({
      ...parsed,
      generatedAt: new Date().toISOString(),
      language,
    });
  } catch (error: any) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ error: error.message || 'Internal server error while generating insights' });
  }
});

// 2. Endpoint: Ask the Agent (Chat with deterministic tool calling)
app.post('/api/ai/chat', async (req, res) => {
  try {
    const ai = getAI();
    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY is not set. Please add GEMINI_API_KEY to your Render environment variables (Dashboard > Environment).',
      });
    }

    const { message, language = 'en', contextData = {}, history = [] } = req.body;

    const langNote =
      language === 'ar'
        ? 'Answer in Arabic (العربية).'
        : language === 'fr'
        ? 'Answer in French (Français).'
        : 'Answer in English.';

    const systemInstruction = `You are the Yes67 BI Agent, a transparent SME business analyst.
CORE PRINCIPLE: All numbers are computed by deterministic TypeScript tools. You NEVER calculate figures yourself; you call the provided tools to fetch the exact numbers, or you answer based on the returned tool data.
If the question is out of scope or the uploaded data does not contain the answer, politely state so.
Always maintain high transparency and cite exact figures returned by the tools.
${langNote}`;

    // Step 1: Initial query to Gemini with tools
    const initialContents = [
      ...history.map((h: any) => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      })),
      {
        role: 'user',
        parts: [{ text: message }],
      },
    ];

    const initialResponse = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: initialContents,
      config: {
        systemInstruction,
        tools,
      },
    });

    // Check if the model called any tools
    const functionCalls = initialResponse.functionCalls;

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      const toolName = call.name || '';
      const toolResult = executeDeterministicTool(toolName, call.args, contextData);

      // Step 2: Send tool response back to Gemini to synthesize natural response
      const toolContents = [
        ...initialContents,
        initialResponse.candidates?.[0]?.content,
        {
          role: 'user',
          parts: [
            {
              text: `Tool "${toolName}" executed. Deterministic result:\n${JSON.stringify(toolResult, null, 2)}\nSynthesize a clear, direct answer in ${language} citing these exact results.`,
            },
          ],
        },
      ];

      const secondResponse = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: toolContents,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        answer: secondResponse.text,
        toolCall: {
          name: call.name,
          args: call.args,
          result: toolResult,
        },
      });
    }

    // Direct answer if no tool call was needed
    res.json({
      answer: initialResponse.text,
      toolCall: null,
    });
  } catch (error: any) {
    console.error('Error handling chat turn:', error);
    res.status(500).json({ error: error.message || 'Internal error processing chat' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Setup Vite middleware or static serving
const PORT = process.env.K_SERVICE
  ? 3000
  : (process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

async function startServer() {
  const distPath = path.resolve('dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));
  const isProduction = process.env.NODE_ENV === 'production' || hasDist;

  if (isProduction) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Yes67 BI Agent server running on http://0.0.0.0:${PORT} (Production mode: ${isProduction})`);
  });
}

startServer();
