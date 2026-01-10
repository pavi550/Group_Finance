
import { GoogleGenAI } from "@google/genai";
import { GroupData } from "../types";

export const getFinancialInsights = async (data: GroupData): Promise<string> => {
  // Fix: Initializing GoogleGenAI with process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const totalSavings = data.records.reduce((sum, r) => sum + r.savings, 0);
  const totalInterest = data.records.reduce((sum, r) => sum + r.interestPaid, 0);
  const activeLoans = data.members.reduce((sum, m) => sum + m.currentLoanPrincipal, 0);
  
  const prompt = `
    Analyze this micro-finance group data and provide a concise professional summary (max 300 words).
    Group Name: ${data.settings.name}
    Monthly Savings Target: ${data.settings.monthlySavingsAmount}
    Total Members: ${data.members.length}
    Total Accumulated Savings: ${totalSavings}
    Total Interest Earned: ${totalInterest}
    Current Active Loan Burden: ${activeLoans}
    
    Data Context:
    - Recent payments: ${JSON.stringify(data.records.slice(-5))}
    - Members with loans: ${data.members.filter(m => m.currentLoanPrincipal > 0).length}
    
    Please provide:
    1. Financial Health Score (1-10)
    2. Key Insights (e.g., collection efficiency, loan risk)
    3. Actionable Recommendations for the group administrator.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // Fix: Access response.text as a property, not a method
    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error connecting to AI advisor. Please check your network or try again later.";
  }
};
