export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  type: "ring" | "card";
};

export const PRODUCTS: Product[] = [
  {
    id: "classic",
    name: "Classic NFC Ring",
    description: "Sleek, minimal NFC ring. Tap to share your RingTap profile. Stainless steel, waterproof.",
    price: 49,
    image: "⌖",
    type: "ring",
  },
  {
    id: "carbon",
    name: "Carbon NFC Ring",
    description: "Lightweight matte black. NFC chip built in—tap any phone to open your profile.",
    price: 59,
    image: "◆",
    type: "ring",
  },
  {
    id: "silver",
    name: "Silver Band NFC Ring",
    description: "Polished silver band. Works with RingTap—one tap shares your ringtap.me link.",
    price: 54,
    image: "○",
    type: "ring",
  },
  {
    id: "metal-card",
    name: "Metal NFC Card",
    description: "Premium metal card with NFC. Wallet-friendly—tap to share your RingTap profile. Brushed finish.",
    price: 34,
    image: "▢",
    type: "card",
  },
  {
    id: "metal-card-black",
    name: "Black Metal NFC Card",
    description: "Matte black metal NFC card. Same tap-to-share as the ring—fits in your wallet.",
    price: 36,
    image: "▪",
    type: "card",
  },
  {
    id: "classic-card",
    name: "Classic NFC Card",
    description: "White plastic NFC card. Program with your ringtap.me link. Slim and durable.",
    price: 19,
    image: "□",
    type: "card",
  },
];
