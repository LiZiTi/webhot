// WebHot Schemas — 共享类型定义

// --- Adapter 接口 ---

export interface FetchParams {
  page?: number;
  limit?: number;
  [key: string]: unknown;
}

export interface RawHotItem {
  id?: string;
  title: string;
  url?: string;
  summary?: string;
  author?: string;
  rank?: number;
  heatScore?: number;
  metrics?: Record<string, number>;
  publishedAt?: string;
  raw?: unknown;
  [key: string]: unknown;
}

export interface HotSourceAdapter {
  id: string;
  name: string;
  type: 'api' | 'rss' | 'html' | 'browser';
  fetchList(params: FetchParams): Promise<RawHotItem[]>;
  normalize(raw: RawHotItem): HotItem;
  healthcheck(): Promise<boolean>;
}

// --- 核心数据模型 ---

export interface HotItem {
  id: string;
  source: string;
  platform: string;
  title: string;
  summary?: string;
  url: string;
  author?: string;
  rank?: number;
  heatScore?: number;
  trendScore?: number;
  financeScore?: number;
  aiScore?: number;
  categories?: string[];
  tags?: string[];
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    stars?: number;
  };
  publishedAt?: string;
  collectedAt: string;
  language?: string;
  region?: string;
  raw?: unknown;
}

export interface TopicCluster {
  id: string;
  title: string;
  aliases: string[];
  category: string;
  hotItems: string[];
  trendScore: number;
  growthScore: number;
  platforms: string[];
  relatedStocks?: string[];
  createdAt: string;
}

// --- 感知引擎类型 ---

export interface HotSnapshot {
  id: string;
  source: string;
  platform: string;
  topicId: string;
  title: string;
  heatScore: number;
  trendScore?: number;
  rank?: number;
  collectedAt: string;
  metrics?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
}

export type SignalType =
  | 'explosion'      // 热点爆发
  | 'cross_platform' // 跨平台扩散
  | 'finance'        // 金融相关热点
  | 'ai'             // AI / MCP / Agent 相关热点
  | 'risk';          // 高风险事件

export interface Signal {
  id: string;
  type: SignalType;
  topicId: string;
  title: string;
  score: number;
  description: string;
  platforms: string[];
  triggeredAt: string;
}

export interface WorldState {
  activeTopics: TopicCluster[];
  trendingTopics: TopicCluster[];
  explodingTopics: TopicCluster[];
  financeTopics: TopicCluster[];
  aiTopics: TopicCluster[];
  riskTopics: TopicCluster[];
  lastUpdatedAt: string;
}

// --- Timeline 系统 ---

export interface TopicTimeline {
  topicId: string;
  title: string;
  events: TimelineEvent[];
}

export interface TimelineEvent {
  time: string;
  platform: string;
  source: string;
  title: string;
  url?: string;
  summary?: string;
  metrics?: {
    heat?: number;
    views?: number;
    likes?: number;
  };
}

// --- 一级分类 ---

export type Category =
  | 'AI'
  | 'Finance'
  | 'Technology'
  | 'Crypto'
  | 'Business'
  | 'Politics'
  | 'Macro'
  | 'Entertainment'
  | 'Gaming'
  | 'Sports'
  | 'Science'
  | 'Developer'
  | 'Startup'
  | 'Consumer'
  | 'Automotive'
  | 'Military'
  | 'Energy'
  | 'Healthcare'
  | 'Education'
  | 'Social';
