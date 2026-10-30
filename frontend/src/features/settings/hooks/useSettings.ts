import { useEffect, useState } from 'react';
import { ApiKeyResponse, GithubConfig } from '../types';
import { fetchSettings } from '../services/setting-service';


export function useSettings() {
    const [apiKeys, setApiKeys] = useState<ApiKeyResponse[]>([]);
    const [githubConfig, setGithubConfig] = useState<null | GithubConfig>(null);

    useEffect(() => {
        async function fetchSetting() {
            try {
                const response = await fetchSettings();
                setApiKeys(response.apiKeys);
                setGithubConfig(response.githubConfig);
            } catch (error) {
                console.error('Error fetching settings:', error);
            }
        }
        fetchSetting();
    }, []); // Empty dependency array means this effect runs once on mount

 return { apiKeys, githubConfig };

}