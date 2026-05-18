import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import { loadOgFonts } from './fonts';

type IconCardInput = {
  readonly name: string;
  readonly category: string;
  readonly brandColor: string;
  readonly colorSvg: string;
  readonly id: string;
  readonly totalIcons: number;
};

type DefaultCardInput = {
  readonly totalIcons: number;
};

const PAPER = '#f7f5f1';
const INK = '#0a0a0a';
const INK_SOFT = '#828079';
const ACCENT = '#cf3a2c';
const WIDTH = 1200;
const HEIGHT = 630;

const toSvgDataUri = (svg: string): string => `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;

const renderToPng = async (element: React.ReactElement): Promise<Buffer> => {
  const { regular, bold, black } = await loadOgFonts();
  const svg = await satori(element, {
    width: WIDTH,
    height: HEIGHT,
    fonts: [
      { name: 'Inter Tight', data: regular, weight: 400, style: 'normal' },
      { name: 'Inter Tight', data: bold, weight: 700, style: 'normal' },
      { name: 'Inter Tight', data: black, weight: 800, style: 'normal' },
    ],
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: WIDTH },
    font: { loadSystemFonts: false },
  });
  return Buffer.from(resvg.render().asPng());
};

/**
 * Renders the per-icon Open Graph card as a 1200×630 PNG.
 *
 * @param input icon name, category label, brand color, color SVG bytes, position id, manifest size
 * @returns PNG buffer ready to be written to `dist/og/<slug>.png`
 */
export const renderIconOg = async (input: IconCardInput): Promise<Buffer> => {
  const iconDataUri = toSvgDataUri(input.colorSvg);
  return renderToPng(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: PAPER,
        fontFamily: 'Inter Tight',
        padding: '64px 72px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '14px',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: INK_SOFT,
        }}
      >
        <span style={{ color: ACCENT }}>—</span>
        <span>Brand Icons</span>
        <span>·</span>
        <span>{input.category}</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          flex: 1,
          gap: '64px',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            width: '320px',
            height: '320px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            border: `1px solid ${INK}`,
            flexShrink: 0,
          }}
        >
          <img src={iconDataUri} width={220} height={220} alt="" />
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            gap: '20px',
          }}
        >
          <div
            style={{
              fontSize: input.name.length > 14 ? '88px' : '120px',
              fontWeight: 800,
              color: INK,
              letterSpacing: '-3px',
              lineHeight: 1,
            }}
          >
            {input.name}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '14px',
              fontSize: '24px',
              fontWeight: 600,
              color: INK_SOFT,
            }}
          >
            <span
              style={{
                display: 'flex',
                width: '20px',
                height: '20px',
                background: input.brandColor,
                border: `1px solid ${INK}`,
              }}
            />
            <span style={{ fontFamily: 'Inter Tight' }}>{input.brandColor.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '22px',
          fontWeight: 700,
          color: INK,
        }}
      >
        <span>brand-icons.com</span>
        <span style={{ color: INK_SOFT, letterSpacing: '2px' }}>
          #{input.id} · {input.totalIcons} ICONS
        </span>
      </div>
    </div>
  );
};

/**
 * Renders the default site-wide Open Graph card.
 *
 * @param input total number of icons in the manifest
 * @returns PNG buffer for the homepage / fallback `/og.png`
 */
export const renderDefaultOg = async (input: DefaultCardInput): Promise<Buffer> =>
  renderToPng(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: PAPER,
        fontFamily: 'Inter Tight',
        padding: '72px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '14px',
          fontSize: '22px',
          fontWeight: 700,
          letterSpacing: '4px',
          textTransform: 'uppercase',
          color: INK_SOFT,
        }}
      >
        <span style={{ color: ACCENT }}>—</span>
        <span>Brand Icons</span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        <div
          style={{
            fontSize: '128px',
            fontWeight: 800,
            color: INK,
            letterSpacing: '-4px',
            lineHeight: 0.95,
          }}
        >
          One library for
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            fontSize: '128px',
            fontWeight: 800,
            color: INK,
            letterSpacing: '-4px',
            lineHeight: 0.95,
          }}
        >
          <span>every&nbsp;</span>
          <span style={{ color: ACCENT }}>brand</span>
          <span>.</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '24px',
          fontWeight: 600,
          color: INK,
        }}
      >
        <span>brand-icons.com</span>
        <span style={{ color: INK_SOFT, letterSpacing: '2px' }}>{input.totalIcons} VERSIONED ICONS · REACT · VUE · SVELTE · WC</span>
      </div>
    </div>
  );
