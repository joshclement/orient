export interface ImageSection {
  label: string;
  facts: string[];
  abnormalIndices?: number[];
}

export interface DreamImage {
  key: string;
  name: string;
  interestRank: number;
  sections: ImageSection[];
}
