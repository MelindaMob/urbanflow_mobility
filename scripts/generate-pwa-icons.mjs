import sharp from "sharp";
import fs from "fs";

const iconSvg = fs.readFileSync("app/icon.svg");

await sharp(iconSvg).resize(192, 192).png().toFile("public/icon-192.png");
await sharp(iconSvg).resize(512, 512).png().toFile("public/icon-512.png");

const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#F8FAFC"/>
  <g transform="translate(51.2 51.2) scale(4.096)">
    <path d="M22,20 C22,50 50,50 50,50 C50,50 78,50 78,80" stroke="#059669" stroke-width="11" stroke-linecap="round" fill="none"/>
    <path d="M78,20 C78,50 50,50 50,50 C50,50 22,50 22,80" stroke="#0284C7" stroke-width="11" stroke-linecap="round" fill="none"/>
  </g>
</svg>`;

await sharp(Buffer.from(maskableSvg))
  .resize(512, 512)
  .png()
  .toFile("public/icon-maskable-512.png");

console.log("PWA icons generated");
