const KNOWN_BOT_PATTERNS = [
  /googlebot|google-inspectiontool|googleother/i,
  /bingbot|bingpreview|adidxbot/i,
  /duckduckbot|baiduspider|yandex(?:bot|images)|sogou|petalbot/i,
  /facebookexternalhit|facebot|twitterbot|linkedinbot|pinterestbot/i,
  /slackbot|discordbot|telegrambot|whatsapp|skypeuripreview/i,
  /applebot|amazonbot|bytespider|ccbot|dotbot|mj12bot/i,
  /ahrefsbot|semrushbot|serpstatbot|seobilitybot|screaming frog/i,
  /gptbot|chatgpt-user|oai-searchbot|anthropic-ai|claudebot|claude-web/i,
  /perplexitybot|cohere-ai|diffbot|imagesiftbot/i,
  /headlesschrome|chrome-lighthouse|pagespeed insights|lighthouse/i,
  /uptimerobot|better uptime|statuscake|pingdom|site24x7|newrelicpinger/i,
  /linkora\/\S+ health-check/i,
];

const AUTOMATION_CLIENT_PATTERNS = [
  /(?:^|\s)curl\//i,
  /(?:^|\s)wget\//i,
  /python-requests|python-urllib|aiohttp|httpx\//i,
  /node-fetch|undici|axios\//i,
  /go-http-client|apache-httpclient|okhttp\//i,
  /java\/\d|libwww-perl|php\/\d|ruby\/\d/i,
];

const GENERIC_BOT_TOKEN = /(?:^|[\s/;(+_-])(?:bot|crawler|spider|scraper)(?:$|[\s/;)+_-])/i;

export function isLikelyBot(userAgent: string | null | undefined): boolean {
  const value = userAgent?.trim();
  if (!value) return false;
  return (
    KNOWN_BOT_PATTERNS.some((pattern) => pattern.test(value)) ||
    AUTOMATION_CLIENT_PATTERNS.some((pattern) => pattern.test(value)) ||
    GENERIC_BOT_TOKEN.test(value)
  );
}
