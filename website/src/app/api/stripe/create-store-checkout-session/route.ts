import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const STRIPE_SECRET = (process.env.STRIPE_SECRET_KEY ?? '').replace(/^["'\s]+|["'\s]+$/g, '').trim();
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ringtap.me';

type CartItemPayload = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string;
};

export async function POST(request: NextRequest) {
  if (!STRIPE_SECRET) {
    return NextResponse.json(
      { error: 'Stripe not configured (STRIPE_SECRET_KEY)' },
      { status: 500 }
    );
  }

  let body: { items?: CartItemPayload[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const stripe = new Stripe(STRIPE_SECRET);

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.size ? `${item.name} (US ${item.size})` : item.name,
        description: item.size ? `Ring size US ${item.size}` : undefined,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: Math.min(Math.max(1, item.quantity), 99),
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${BASE_URL}/store/cart?success=1`,
      cancel_url: `${BASE_URL}/store/cart`,
      shipping_address_collection: {
        allowed_countries: [
          'AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AT', 'AU', 'AW', 'AX', 'AZ',
          'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
          'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY', 'CZ',
          'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
          'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
          'FI', 'FJ', 'FK', 'FO', 'FR',
          'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
          'HK', 'HN', 'HR', 'HT', 'HU',
          'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT',
          'JE', 'JM', 'JO', 'JP',
          'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ',
          'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
          'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
          'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
          'OM',
          'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PY',
          'QA',
          'RE', 'RO', 'RS', 'RU', 'RW',
          'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ',
          'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
          'UA', 'UG', 'US', 'UY', 'UZ',
          'VA', 'VC', 'VE', 'VG', 'VN', 'VU',
          'WF', 'WS',
          'XK',
          'YE', 'YT',
          'ZA', 'ZM', 'ZW',
          'ZZ',
        ],
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Stripe error: ${message}` }, { status: 500 });
  }
}
