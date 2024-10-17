import { ActivityType, formatEmoji, GuildMember, Presence } from "discord.js";
import { Presence as PresenceObject } from "../interfaces/Presence";
import { formatAssets, formatBadges, formatTitle } from "./FormatUtils";
import { app } from "..";

export async function sendPresence(guildMember: GuildMember, newPresence: Presence, ws?: any, local?: boolean) {
  if (newPresence) {
    let presenceObject: PresenceObject = {
      _id: newPresence.userId,
      tag: newPresence.user.tag.split("#")[1] == "0" ? newPresence.user.tag.split("#")[0] : newPresence.user.tag,
      pfp: newPresence.user.displayAvatarURL({ forceStatic: false }),
      status: newPresence.status,
      customStatus: null,
      activities: [],
      platform: newPresence.clientStatus,
      badges: await formatBadges(newPresence.user.flags, newPresence.user),
    }
    if (newPresence.activities.length > 0) {
      if (newPresence.activities[0].type === 4) {
        presenceObject.customStatus = {
          name: newPresence.activities[0].state,
          createdTimestamp: newPresence.activities[0].createdTimestamp,
          emoji: newPresence.activities[0].emoji ? formatEmoji(newPresence.activities[0].emoji) : null,
        }
      }
      for (let i = 0; i < newPresence.activities.length; i++) {
        const presence = newPresence.activities[i];
        if (presence.name !== "Custom Status") {
          presenceObject.activities.push({
            applicationId: presence.applicationId,
            assets: await formatAssets(presence),
            details: presence.details,
            emoji: presence.emoji ? formatEmoji(presence.emoji) : null,
            name: presence.name,
            title: formatTitle(presence),
            state: presence.state,
            type: ActivityType[presence.type],
            timestamps: presence.timestamps ? {start: presence.timestamps.start, end: presence.timestamps.end} : null,
          })
        }
      }
    }
    if (local && ws) {
      ws.send(JSON.stringify(presenceObject))
    } else {
      app.server?.publish(newPresence.userId, JSON.stringify(presenceObject));
    }
  } else {
    let presenceObject: PresenceObject = {
      _id: guildMember.id,
      tag: guildMember.user.tag.split("#")[1] == "0" ? guildMember.user.tag.split("#")[0] : guildMember.user.tag,
      pfp: guildMember.user.displayAvatarURL({ forceStatic: false }),
      status: "offline",
      customStatus: null,
      activities: [],
      platform: {},
      badges: await formatBadges(guildMember.user.flags, guildMember.user),
    }
    if (local && ws) {
      ws.send(JSON.stringify(presenceObject))
    } else {
      app.server?.publish(newPresence.userId, JSON.stringify(presenceObject));
    }
  }
}
