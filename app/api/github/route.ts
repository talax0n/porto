import { streaks } from "@/data/github";

const USERNAME = process.env.GITHUB_USERNAME ?? "talax0n";

/* The contribution calendar only exists in GitHub's GraphQL API, which always
   requires a token — hence the server route rather than a client fetch. */
const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      createdAt
      contributionsCollection {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        commitContributionsByRepository(maxRepositories: 25) {
          repository {
            nameWithOwner
            isPrivate
          }
        }
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

/** contributionsCollection spans at most a year, so the full history is one alias per year */
const yearsQuery = (from: number, to: number) => `
  query ($login: String!) {
    user(login: $login) {
      ${Array.from({ length: to - from + 1 }, (_, i) => from + i)
        .map(
          (y) => `y${y}: contributionsCollection(from: "${y}-01-01T00:00:00Z", to: "${y}-12-31T23:59:59Z") {
        contributionCalendar { weeks { contributionDays { date contributionCount } } }
      }`
        )
        .join("\n")}
    }
  }
`;

interface Collection {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  commitContributionsByRepository: { repository: { nameWithOwner: string; isPrivate: boolean } }[];
  contributionCalendar: { totalContributions: number; weeks: { contributionDays: Day[] }[] };
}

interface User {
  createdAt: string;
  contributionsCollection: Collection;
}

type Years = Record<string, { contributionCalendar: { weeks: { contributionDays: Omit<Day, "contributionLevel">[] }[] } }>;

async function gql<T>(token: string, query: string): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables: { login: USERNAME } }),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
  const json = (await res.json()) as { data?: { user?: T }; errors?: { message: string }[] };
  // GraphQL reports auth/scope problems in a 200 body, so check here too
  if (!json.data?.user) throw new Error(json.errors?.[0]?.message ?? "Unexpected GitHub response");
  return json.data.user;
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: "GITHUB_TOKEN is not set" },
      { status: 501 }
    );
  }

  let user: User;
  let years: Years;
  try {
    user = await gql<User>(token, QUERY);
    years = await gql<Years>(
      token,
      yearsQuery(new Date(user.createdAt).getUTCFullYear(), new Date().getUTCFullYear())
    );
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 502 });
  }

  const c = user.contributionsCollection;
  const calendar = c.contributionCalendar;
  const history = Object.values(years).flatMap((y) =>
    y.contributionCalendar.weeks.flatMap((w) =>
      w.contributionDays.map((d) => ({ date: d.date, count: d.contributionCount }))
    )
  );
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });

  return Response.json({
    username: USERNAME,
    since: user.createdAt.slice(0, 10),
    total: calendar.totalContributions,
    allTime: history.reduce((n, d) => n + d.count, 0),
    streak: streaks(history, today),
    activity: {
      commits: c.totalCommitContributions,
      pullRequests: c.totalPullRequestContributions,
      issues: c.totalIssueContributions,
      reviews: c.totalPullRequestReviewContributions,
    },
    repos: {
      count: c.totalRepositoriesWithContributedCommits,
      top: c.commitContributionsByRepository
        .filter((r) => !r.repository.isPrivate)
        .slice(0, 3)
        .map((r) => r.repository.nameWithOwner),
    },
    weeks: calendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        level: LEVELS[d.contributionLevel] ?? 0,
      }))
    ),
  });
}
