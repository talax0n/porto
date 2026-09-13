const USERNAME = process.env.GITHUB_USERNAME ?? "talax0n";

/* The contribution calendar only exists in GitHub's GraphQL API, which always
   requires a token — hence the server route rather than a client fetch. */
const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              contributionLevel
            }
          }
        }
      }
    }
  }
`;

const LEVELS: Record<string, number> = {
  NONE: 0,
  FIRST_QUARTILE: 1,
  SECOND_QUARTILE: 2,
  THIRD_QUARTILE: 3,
  FOURTH_QUARTILE: 4,
};

interface Day {
  date: string;
  contributionCount: number;
  contributionLevel: string;
}

export const revalidate = 3600;

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: "GITHUB_TOKEN is not set" },
      { status: 501 }
    );
  }

  let res: Response;
  try {
    res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: QUERY, variables: { login: USERNAME } }),
      next: { revalidate },
    });
  } catch {
    return Response.json({ error: "GitHub is unreachable" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json(
      { error: `GitHub returned ${res.status}` },
      { status: 502 }
    );
  }

  const json = await res.json();
  const calendar =
    json?.data?.user?.contributionsCollection?.contributionCalendar;

  if (!calendar) {
    // GraphQL reports auth/scope problems in a 200 body, so check here too
    const message = json?.errors?.[0]?.message ?? "Unexpected GitHub response";
    return Response.json({ error: message }, { status: 502 });
  }

  return Response.json({
    username: USERNAME,
    total: calendar.totalContributions as number,
    weeks: (calendar.weeks as { contributionDays: Day[] }[]).map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      }))
    ),
  });
}
