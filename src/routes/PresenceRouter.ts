import Elysia from "elysia";
import { client } from "..";
import { sendPresence } from "../utils/PresenceUtils";

let socket_map = new Map<string, Set<string>>()

export const PresenceRouter = new Elysia({ prefix: "/presence" })
    .ws('/', {
        open(ws) {
            try {
                const defaultUserId = process.env.USER_ID!
                socket_map.set(ws.id, new Set([defaultUserId]))
                ws.subscribe(defaultUserId)

                const guild = client.guilds.cache.get(process.env.GUILD_ID)
                if (!guild) {
                    console.error("Guild not found")
                    ws.send(JSON.stringify({ error: "Server configuration error" }))
                    return
                }

                const guildMember = guild.members.cache.get(defaultUserId)
                if (!guildMember) {
                    console.error(`Guild member with ID ${defaultUserId} not found`)
                    ws.send(JSON.stringify({ error: "User not found" }))
                    return
                }

                const newPresence = guildMember.presence
                sendPresence(guildMember, newPresence, ws, true)
            } catch (error) {
                console.error("WebSocket open error:", error)
                ws.send(JSON.stringify({ error: "Failed to initialize connection" }))
            }
        },
        async message(ws, message) {
            try {
                if (message === "ping") {
                    ws.send("pong")
                    return
                }

                try {
                    const data = JSON.parse(message as string)
                    if (data.action === "subscribe" && data.userId) {
                        const guild = client.guilds.cache.get(process.env.GUILD_ID)
                        if (!guild) return

                        const userSet = socket_map.get(ws.id) || new Set()
                        userSet.add(data.userId)
                        socket_map.set(ws.id, userSet)
                        ws.subscribe(data.userId)

                        const guildMember = guild.members.cache.get(data.userId)
                        if (guildMember) {
                            sendPresence(guildMember, guildMember.presence, ws, true)
                        }
                    } else if (data.action === "unsubscribe" && data.userId) {
                        const userSet = socket_map.get(ws.id)
                        if (userSet) {
                            userSet.delete(data.userId)
                            ws.unsubscribe(data.userId)
                        }
                    }
                } catch (e) {
                }
            } catch (error) {
                console.error("WebSocket message error:", error)
            }
        },
        async close(ws) {
            try {
                const userSet = socket_map.get(ws.id)
                if (userSet) {
                    for (const userId of userSet) {
                        ws.unsubscribe(userId)
                    }
                    socket_map.delete(ws.id)
                }
            } catch (error) {
                console.error("WebSocket close error:", error)
            }
        }
    })