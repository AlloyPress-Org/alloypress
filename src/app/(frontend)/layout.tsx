import React from 'react'
import './styles.css'

export const metadata = {
  title: 'AlloyPress CMS',
  description: 'AlloyPress content API',
  robots: { index: false, follow: false },
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
