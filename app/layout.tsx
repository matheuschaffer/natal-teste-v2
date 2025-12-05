import type { Metadata } from "next"
import { Outfit, Great_Vibes, Playfair_Display, Mountains_of_Christmas, DM_Serif_Display, Lora } from "next/font/google"
import { Toaster } from "sonner"
import Script from "next/script"
import "./globals.css"

const outfit = Outfit({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-outfit",
})

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-great-vibes",
})

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
})

const mountainsOfChristmas = Mountains_of_Christmas({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mountains-christmas",
})

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-dm-serif-display",
})

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
})

export const metadata: Metadata = {
  title: "Natal Mágico - Crie sua homenagem especial",
  description: "Crie uma página de homenagem natalina única e especial para sua família",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID

  return (
    <html lang="pt-BR">
      <head>
        {pixelId && (
          <>
            <Script
              id="fb-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${pixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body className={`${outfit.variable} ${greatVibes.variable} ${playfairDisplay.variable} ${mountainsOfChristmas.variable} ${dmSerifDisplay.variable} ${lora.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}

