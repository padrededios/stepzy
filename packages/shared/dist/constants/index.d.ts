type SportType = 'football' | 'badminton' | 'volley' | 'pingpong' | 'rugby';
interface SportConfig {
    id: SportType;
    name: string;
    icon: string;
    maxPlayers: number;
    minPlayers: number;
    description: string;
    color: string;
}
declare const SPORTS_CONFIG: Record<SportType, SportConfig>;
declare const getSportConfig: (sport: SportType) => SportConfig;
declare const getAllSports: () => SportConfig[];

export { SPORTS_CONFIG, type SportConfig, type SportType, getAllSports, getSportConfig };
