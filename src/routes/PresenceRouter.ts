import Elysia from "elysia";
import { client } from "..";
import { sendPresence } from "../utils/PresenceUtils";

let socket_map = new Map<string, string>()

export const PresenceRouter = new Elysia({ prefix: "/presence" })
    .ws('/', {
        async open(ws) {
            ws.subscribe(process.env.USER_ID!)
            socket_map.set(ws.id, process.env.USER_ID!)
            let guildMember = client.guilds.cache.get(process.env.GUILD_ID).members.cache.get(process.env.USER_ID!)
            let newPresence = guildMember.presence
            sendPresence(guildMember, newPresence)
        },
        async close(ws) {
            if (socket_map.has(ws.id)) {
                let discord_id = socket_map.get(ws.id)!
                ws.unsubscribe(discord_id)
                socket_map.delete(ws.id)
            }
        }
    })
