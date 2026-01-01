import { channel, channelToken } from "@ocean-dataview/db/schema/channel";
import { createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

// Channel schemas
export const selectChannelSchema = createSelectSchema(channel).pick({
	id: true,
	displayName: true,
	marketplaceId: true,
	userId: true,
});

export type SelectChannel = z.infer<typeof selectChannelSchema>;

// Channel token schemas
export const selectChannelTokenSchema = createSelectSchema(channelToken).pick({
	id: true,
	channelId: true,
	accessToken: true,
	refreshToken: true,
	accessTokenExpiresAt: true,
	refreshTokenExpiresAt: true,
});

export type SelectChannelToken = z.infer<typeof selectChannelTokenSchema>;
