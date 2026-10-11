This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Realtime practice rooms

Room pages use Supabase Realtime presence and broadcast channels to show connected participants and share their recognized sentences and grammar results live. Users can edit their display name in the room; otherwise, a guest name and session ID are generated. Transcripts are only broadcast live and are not saved for participants who join later.

Voice calls use browser WebRTC for peer-to-peer audio. Create a Supabase project, make sure Realtime is enabled, and add its project URL and public anon/publishable key to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-public-anon-or-publishable-key>
```

Restart the dev server after changing environment variables. The route's `[roomId]` is used as the signaling channel, so people must open the same room URL to connect. The existing `NEXT_PUBLIC_DAILY_ROOM_URL` setting is no longer used.

This prototype uses a public signaling channel and a STUN server, with no TURN relay or room authentication. Anyone who knows a room URL may be able to join its signaling channel, and some network configurations will block direct peer connections. Use authenticated/private channels and a TURN service before relying on this for private or production calls. Peer-to-peer mesh calls are intended for small groups.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
