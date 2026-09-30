export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        // escape "<" so a title containing </script> can't break out
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}