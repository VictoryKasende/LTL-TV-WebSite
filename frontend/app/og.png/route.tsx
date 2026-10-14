import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

// Default link-preview card (1200×630) for pages without their own picture —
// the home page, lists, contact… Rendered once at build time.
export const dynamic = 'force-static';

export async function GET() {
  const logo = await readFile(join(process.cwd(), 'public', 'logo-ltl-white.svg'));
  const logoSrc = `data:image/svg+xml;base64,${logo.toString('base64')}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #141640 0%, #212870 45%, #3D53EA 100%)',
          color: 'white',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={354} height={150} alt="" />
        <div style={{ marginTop: 48, fontSize: 56, fontWeight: 700 }}>La chaîne chrétienne</div>
        <div style={{ marginTop: 16, fontSize: 30, color: 'rgba(255,255,255,0.75)' }}>
          Annoncer l&apos;Évangile par les médias
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 26,
            letterSpacing: 4,
            color: '#F5C24E',
          }}
        >
          LTLTV.COM
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
