import { createRouter } from 'sv-router';

import HomePage from './pages/HomePage.svelte';
import PlayersPage from './pages/PlayersPage.svelte';
import PlayerPage from './pages/PlayerPage.svelte';
import HistoryPage from './pages/HistoryPage.svelte';
import MatchSetupPage from './pages/MatchSetupPage.svelte';
import MatchRecordPage from './pages/MatchRecordPage.svelte';
import MatchRecapPage from './pages/MatchRecapPage.svelte';
import WhitelistPage from './pages/WhitelistPage.svelte';

export const routes = {
    '/': HomePage,
    '/players': PlayersPage,
    '/player/:id': PlayerPage,
    '/history': HistoryPage,
    '/whitelist': WhitelistPage,
    '/match/setup': MatchSetupPage,
    '/match/:id/record': MatchRecordPage,
    '/match/:id/recap': MatchRecapPage
  };

export const { p, navigate, isActive, preload, route } = createRouter(routes);

