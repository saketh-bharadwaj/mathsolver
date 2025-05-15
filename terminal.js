import readline from "readline";
import dotenv from "dotenv";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("❌ Missing GITHUB_TOKEN in .env file!");
  process.exit(1);
}

const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Meta-Llama-3.1-8B-Instruct";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "You: "
});

const messages = [
  { role: "system", content: "You are a helpful assistant." }
];

const client = ModelClient(endpoint, new AzureKeyCredential(token));

async function sendMessage(userInput) {
  messages.push({ role: "user", content: userInput });

  try {
    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        model: modelName
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    const botReply = response.body.choices[0]?.message?.content || "⚠️ No response.";
    console.log(`🤖 Bot: ${botReply}`);
    messages.push({ role: "assistant", content: botReply });
  } catch (err) {
    console.error("Error:", err.message || err);
  }
}

console.log("💬 Chat started. Type your message and press Enter.");
rl.prompt();

rl.on("line", async (line) => {
  const userMessage = line.trim();
  if (userMessage.toLowerCase() === "exit") {
    rl.close();
    return;
  }

  await sendMessage(userMessage);
  rl.prompt();
}).on("close", () => {
  console.log("👋 Chat ended.");
  process.exit(0);
});
