import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { helmet } from "elysia-helmet";
import { PresenceRouter } from "./routes/PresenceRouter";
import { Client, GatewayIntentBits } from "discord.js";
import { sendPresence } from "./utils/PresenceUtils";

let requiredEnvVars = [
  "BOT_TOKEN",
  "GUILD_ID",
  "USER_ID",
  "FRONTEND_URL",
  "PORT"
]

for (let envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

export const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences],
})

client.on("ready", (client) => {
  console.log(`Logged in as ${client.user.tag}`)
})

client.on("presenceUpdate", async (oldPresence, newPresence) => {
  let guildMember = client.guilds.cache.get(process.env.GUILD_ID).members.cache.get(process.env.USER_ID!)
  sendPresence(guildMember, newPresence)
})

client.login(process.env.BOT_TOKEN)

export const app = new Elysia()
  .use(PresenceRouter)
  .get("/", () => {
    return {
      success: true,
      "🐱": "meow",
    };
  })
  .onError(({ code }) => {
    if (code === "NOT_FOUND") {
      return "Route not found :(";
    }
  })
  .use(
    cors({
      origin: [process.env.FRONTEND_URL!, 'http://localhost:3070'],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    })
  )
  .use(
    helmet({
      originAgentCluster: true,
      dnsPrefetchControl: true,
      permittedCrossDomainPolicies: true,
      hidePoweredBy: true,
    })
  )
  .listen({ port: process.env.PORT!, hostname: "0.0.0.0" });

console.log(
  `Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
