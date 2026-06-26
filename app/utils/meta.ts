type Props = {
  title: string;
  description?: string;
  isHomepage?: boolean;
};

export function createMeta({
  title,
  description = "Catch up on trip expenses with friends!",
  isHomepage = false,
}: Props) {
  const fullTitle = isHomepage ? "Catch Up Bro" : `${title} | Catch Up Bro`;

  return [
    { title: fullTitle },
    { name: "description", content: description },

    // Open Graph
    { property: "og:type", content: "website" },
    { property: "og:title", content: fullTitle },
    { property: "og:description", content: description },
    { property: "og:image", content: "/passport.png" },
  ];
}
