import React, { useState, useCallback, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import BirthdayCountdownPage from './components/BirthdayCountdownPage';
import CoverPage from './components/CoverPage';
import MainPage from './components/MainPage';
import SadMemoriesGallery from './components/SadMemoriesGallery';
import HappyMemoriesGallery from './components/HappyMemoriesGallery';
import QnASection from './components/QnASection';
import MobileInfoScreen from './components/MobileInfoScreen';
import DevControls from './components/DevControls';
import SeeThisView from './components/SeeThisView';
// TELEPORT_24H_NAV: Dynamic 24-hour visitor navigation system with midnight IST reset
import TeleportDropdown from './components/TeleportDropdown';
import {
  loadTeleport24hNavState,
  saveTeleport24hNavState,
  clearTeleport24hNavState,
  isTeleportNavEnabled,
  checkAndPurgeIfExpired,
} from './utils/teleport24hNav';
import { BIRTHDAY_CONFIG, parseISTTarget } from './config';
import { isMobileOrTabletDevice } from './utils/deviceDetector';
import { audioController } from './utils/audioController';

/**
 * Main Application Orchestrator
 * Strictly maintains the 3-stage flow with two completely independent timers:
 * 
 * STAGE 1 — COVER PAGE (BirthdayCountdownPage)
 * - Timer 1 belongs only to the cover countdown page (`coverTargetDate`).
 * - When Timer 1 reaches zero -> navigates to Firecracker page (`stage = 'fireworks'`).
 * - Shows Firecracker page with Timer 2 in normal countdown state.
 * - Does NOT launch fireworks; does NOT display HAPPY BIRTHDAY; does NOT navigate to main page.
 * 
 * STAGE 2 — FIRECRACKER PAGE (CoverPage)
 * - Timer 2 belongs only to the Firecracker page (`firecrackerTargetDate`).
 * - When Timer 2 reaches zero -> launches colorful crackers/fireworks in open sky.
 * - Does NOT form or display HAPPY BIRTHDAY at this stage!
 * - Heart button appears / becomes active in the animation.
 * 
 * STAGE 3 — FIRST HEART CLICK
 * - Starts particle-based "HAPPY BIRTHDAY" animation.
 * - Completed message holds indefinitely in the sky.
 * - Does NOT navigate to main page.
 * 
 * STAGE 4 — SECOND HEART CLICK
 * - Smoothly navigates to Main Birthday Page (`MainPage`).
 * - Main page and Sad Memories gallery flow proceed seamlessly.
 */
export default function App() {
  // Mobile & tablet device detection state (survives reload, refresh, navigation)
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(() => isMobileOrTabletDevice());

  useEffect(() => {
    const handleDeviceCheck = () => {
      setIsMobileOrTablet(isMobileOrTabletDevice());
    };
    window.addEventListener('resize', handleDeviceCheck);
    window.addEventListener('orientationchange', handleDeviceCheck);
    return () => {
      window.removeEventListener('resize', handleDeviceCheck);
      window.removeEventListener('orientationchange', handleDeviceCheck);
    };
  }, []);

  // Helper to parse and calculate IST target
  const getInitialCoverTarget = () => {
    const oc = BIRTHDAY_CONFIG.openingCountdown;
    if (oc && (oc.targetDate || oc.targetTime)) {
      const ms = parseISTTarget(oc.targetDate, oc.targetTime);
      if (ms) return new Date(ms).toISOString();
    }
    return BIRTHDAY_CONFIG.coverTargetDate || BIRTHDAY_CONFIG.targetDate || null;
  };

  const getInitialFirecrackerTarget = () => {
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    if (sc && (sc.targetDate || sc.targetTime)) {
      const ms = parseISTTarget(sc.targetDate, sc.targetTime);
      if (ms) return new Date(ms).toISOString();
    }
    return BIRTHDAY_CONFIG.firecrackerTargetDate || BIRTHDAY_CONFIG.targetDate || null;
  };

  // Compute initial stage & celebration signal based on actual current IST time vs. config.js countdowns
  const computeInitialExperienceState = () => {
    // 1. Allow explicit dev preview stage query parameter if present (e.g. ?stage=main or ?stage=sad-memories)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage') || params.get('page');
      if (stageParam && ['countdown', 'fireworks', 'main', 'sad-memories', 'happy-gallery', 'qna'].includes(stageParam)) {
        return {
          stage: stageParam,
          celebrationSignal: stageParam === 'fireworks' ? 1 : 0,
        };
      }
    }

    // 2. TELEPORT_24H_NAV: Restore last active stage from 24-hour visitor state if second countdown completed
    if (typeof window !== 'undefined') {
      const savedState = loadTeleport24hNavState();
      if (savedState && savedState.secondCountdownCompleted && savedState.lastActiveSection) {
        if (['main', 'sad-memories', 'happy-gallery', 'qna'].includes(savedState.lastActiveSection)) {
          return {
            stage: savedState.lastActiveSection,
            celebrationSignal: 0,
          };
        }
      }
    }

    const now = Date.now();
    const oc = BIRTHDAY_CONFIG.openingCountdown;
    const sc = BIRTHDAY_CONFIG.secondCountdown;

    const target1 = parseISTTarget(oc?.targetDate, oc?.targetTime) || (BIRTHDAY_CONFIG.coverTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.coverTargetDate) : null);
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);

    // CASE A – First countdown has NOT expired
    // If current IST time is earlier than the first countdown target:
    // - Show the Cover Page.
    // - Display the first countdown.
    // - Keep the second countdown page hidden.
    if (target1 && now < target1) {
      return { stage: 'countdown', celebrationSignal: 0 };
    }

    // CASE C – Both countdowns have expired
    // If current IST time is equal to or later than the second countdown target:
    // - Skip both countdown pages.
    // - Start the existing fireworks celebration immediately.
    // - Trigger the welcome song according to its existing audio rules.
    // - Preserve the existing heart-button sequence.
    if (target2 && now >= target2) {
      return { stage: 'fireworks', celebrationSignal: 1 };
    }

    // CASE B – First countdown HAS expired, but second countdown has NOT expired
    // If current IST time is equal to or later than the first target, but earlier than the second target:
    // - Skip the Cover Page completely.
    // - Open the SECOND countdown / Fireworks page immediately.
    // - Display the second countdown with its correct remaining time.
    // - Never show the expired first countdown at 00:00:00:00.
    return { stage: 'fireworks', celebrationSignal: 0 };
  };

  const initialExperienceState = computeInitialExperienceState();

  // Stage state: 'countdown' | 'fireworks' | 'main' | 'sad-memories' | 'happy-gallery' | 'qna'
  const [stage, setStage] = useState(initialExperienceState.stage);

  // Signal to trigger fireworks celebration on Firecracker page (0 = idle, >0 = celebrate)
  const [celebrationSignal, setCelebrationSignal] = useState(initialExperienceState.celebrationSignal);

  // Timer 1: Cover / Blurred Countdown Page Target Date (IST)
  const [coverTargetDate, setCoverTargetDate] = useState(getInitialCoverTarget);

  // Timer 2: Firecracker / Rooftop Page Target Date (IST)
  const [firecrackerTargetDate, setFirecrackerTargetDate] = useState(getInitialFirecrackerTarget);

  // ============================================================================
  // TELEPORT_24H_NAV: STATE, PERSISTENCE & MIDNIGHT RESET
  // ============================================================================
  const [teleportNavEnabledState, setTeleportNavEnabledState] = useState(() => isTeleportNavEnabled());
  const [savedNavState] = useState(() => (typeof window !== 'undefined' ? loadTeleport24hNavState() : null));

  // Tracks whether the second countdown has genuinely completed
  const [secondCountdownCompleted, setSecondCountdownCompleted] = useState(() => {
    if (savedNavState?.secondCountdownCompleted) return true;
    const now = Date.now();
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);
    return Boolean(target2 && now >= target2);
  });

  // Tracks whether Teleport dropdown is unlocked (unlocked once Sad Gallery is visited)
  const [teleportUnlocked, setTeleportUnlocked] = useState(() => Boolean(savedNavState?.teleportUnlocked));

  // Tracks all visited sections
  const [visitedSections, setVisitedSections] = useState(() => savedNavState?.visitedSections || []);

  // Q&A progress states for restoration
  const [qnaInitialStep, setQnaInitialStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const s = p.get('step') || p.get('qnaStep');
      if (s) return s;
    }
    return savedNavState?.navigationProgress?.qnaStep || 'question';
  });
  const [qnaInitialQuestionIndex, setQnaInitialQuestionIndex] = useState(() => savedNavState?.navigationProgress?.qnaQuestionIndex || 0);
  const [qnaCurrentStep, setQnaCurrentStep] = useState(() => savedNavState?.navigationProgress?.qnaStep || 'question');

  // TELEPORT_24H_NAV: Listen for developer toggle & midnight expiration
  useEffect(() => {
    const handleToggleEvent = (e) => {
      setTeleportNavEnabledState(Boolean(e.detail?.enabled));
    };

    const handleResetEvent = () => {
      setTeleportUnlocked(false);
      setVisitedSections([]);
    };

    const checkExpiration = () => {
      if (checkAndPurgeIfExpired()) {
        setTeleportUnlocked(false);
        setVisitedSections([]);
      }
    };

    window.addEventListener('teleport-toggle-changed', handleToggleEvent);
    window.addEventListener('teleport-midnight-reset', handleResetEvent);
    window.addEventListener('visibilitychange', checkExpiration);
    window.addEventListener('focus', checkExpiration);

    // Periodic check for open tabs across 12:00 AM IST
    const intervalId = setInterval(checkExpiration, 15000);

    return () => {
      window.removeEventListener('teleport-toggle-changed', handleToggleEvent);
      window.removeEventListener('teleport-midnight-reset', handleResetEvent);
      window.removeEventListener('visibilitychange', checkExpiration);
      window.removeEventListener('focus', checkExpiration);
      clearInterval(intervalId);
    };
  }, []);

  // Synchronize background music section ownership whenever the active stage changes
  useEffect(() => {
    if (stage === 'countdown') {
      audioController.setActiveSection('countdown');
    } else if (stage === 'fireworks') {
      audioController.setActiveSection('fireworks');
    } else if (stage === 'main') {
      audioController.setActiveSection('main');
    } else if (stage === 'sad-memories') {
      audioController.setActiveSection('sad');
    } else if (stage === 'happy-gallery') {
      audioController.setActiveSection('happy');
    } else if (stage === 'qna') {
      audioController.startQnaPlayback();
    }
  }, [stage]);

  // ---------------------------------------------------------------------------
  // 1. STRICTLY SEPARATED HANDLERS
  // ---------------------------------------------------------------------------

  // Handler 1: Cover Timer Complete -> ONLY navigates to Firecracker page
  const handleCoverTimerComplete = useCallback(() => {
    const now = Date.now();
    const sc = BIRTHDAY_CONFIG.secondCountdown;
    const target2 = parseISTTarget(sc?.targetDate, sc?.targetTime) || (BIRTHDAY_CONFIG.firecrackerTargetDate ? parseISTTarget(BIRTHDAY_CONFIG.firecrackerTargetDate) : null);

    if (target2 && now >= target2) {
      setCelebrationSignal(1);
      setSecondCountdownCompleted(true);
      saveTeleport24hNavState({
        secondCountdownCompleted: true,
        fireworksUnlocked: true,
      });
    } else {
      setCelebrationSignal(0);
    }
    setStage('fireworks');
    setFirecrackerTargetDate((prev) => {
      if (sc && (sc.targetDate || sc.targetTime)) {
        const ms = parseISTTarget(sc.targetDate, sc.targetTime);
        if (ms) return new Date(ms).toISOString();
      }
      return prev || null;
    });
  }, []);

  // Handler 2: Firecracker Timer Complete -> ONLY starts fireworks celebration
  const handleFirecrackerTimerComplete = useCallback(() => {
    setSecondCountdownCompleted(true);
    setStage('fireworks');
    setCelebrationSignal((prev) => prev + 1);
    saveTeleport24hNavState({
      secondCountdownCompleted: true,
      fireworksUnlocked: true,
    });
  }, []);

  // Handler 3: Heart Button Click -> ONLY navigates to Main Birthday Page after celebration
  const handleHeartButtonClick = useCallback(() => {
    setStage('main');
    saveTeleport24hNavState({
      lastActiveSection: 'main',
    });
  }, []);

  // Sad Gallery state preservation (tracks view & photoIndex so returning from Happy Gallery restores state)
  const [sadGalleryState, setSadGalleryState] = useState(() => (
    savedNavState?.navigationProgress?.sadGalleryState || {
      view: 'cover',
      photoIndex: 0,
    }
  ));

  const handleSadGalleryStateChange = useCallback((nextState) => {
    setSadGalleryState(nextState);
    saveTeleport24hNavState({
      navigationProgress: { sadGalleryState: nextState },
    });
  }, []);

  // Open Sad Memories Gallery from Main Page
  const handleOpenSadMemories = useCallback(() => {
    setSadGalleryState({ view: 'cover', photoIndex: 0 });
    setStage('sad-memories');
  }, []);

  // Track initial section index for Main Birthday page (0 by default, 12 when returning to Section 13)
  const [mainPageSectionIndex, setMainPageSectionIndex] = useState(() => (
    savedNavState?.navigationProgress?.mainSectionIndex || 0
  ));

  const handleMainSectionChange = useCallback((index) => {
    setMainPageSectionIndex(index);
    saveTeleport24hNavState({
      navigationProgress: { mainSectionIndex: index },
    });
  }, []);

  // Return from Sad Memories Gallery to Main Birthday Section 13
  const handleBackToMainLastSection = useCallback(() => {
    setMainPageSectionIndex(12); // Section 13 (0-indexed: 12)
    setStage('main');
  }, []);

  // Return from Sad Memories Gallery to Main Page
  const handleBackFromSadMemories = useCallback(() => {
    setStage('main');
  }, []);

  // Open Happy Memories Gallery
  const handleOpenHappyGallery = useCallback(() => {
    setStage('happy-gallery');
  }, []);

  // Return from Happy Memories Gallery to Sad Gallery (restores previous state)
  const handleBackToSadGallery = useCallback(() => {
    setStage('sad-memories');
  }, []);

  // Return from Happy Memories Gallery to Main Page
  const handleBackFromHappyGallery = useCallback(() => {
    setStage('main');
  }, []);

  // Open Q&A Section from Happy Gallery
  const handleOpenQnA = useCallback(() => {
    audioController.startQnaPlayback();
    setStage('qna');
  }, []);

  // Return from Q&A Section to Happy Gallery
  const handleBackFromQnAToHappyGallery = useCallback(() => {
    audioController.setActiveSection('happy');
    setStage('happy-gallery');
  }, []);

  // Handle Q&A Progress Change
  const handleQnAProgressChange = useCallback(({ step, questionIndex }) => {
    setQnaCurrentStep(step);
    if (step === 'final-message') {
      setVisitedSections((prev) => Array.from(new Set([...prev, 'qna-final'])));
      saveTeleport24hNavState({
        visitedSections: ['qna', 'qna-final'],
        navigationProgress: { qnaStep: step, qnaQuestionIndex: questionIndex },
      });
    } else {
      saveTeleport24hNavState({
        navigationProgress: { qnaStep: step, qnaQuestionIndex: questionIndex },
      });
    }
  }, []);

  // ============================================================================
  // TELEPORT_24H_NAV: VISITATION TRACKING & AUDIO/STAGE COORDINATION
  // ============================================================================
  useEffect(() => {
    if (stage === 'main') {
      setVisitedSections((prev) => Array.from(new Set([...prev, 'main'])));
      saveTeleport24hNavState({
        visitedSections: ['main'],
        lastActiveSection: 'main',
        secondCountdownCompleted: true,
      });
    } else if (stage === 'sad-memories') {
      // Visiting Sad Gallery unlocks Teleport permanently!
      setTeleportUnlocked(true);
      setVisitedSections((prev) => Array.from(new Set([...prev, 'main', 'sad-memories'])));
      saveTeleport24hNavState({
        teleportUnlocked: true,
        visitedSections: ['main', 'sad-memories'],
        lastActiveSection: 'sad-memories',
        secondCountdownCompleted: true,
        navigationProgress: { sadGalleryState },
      });
    } else if (stage === 'happy-gallery') {
      setVisitedSections((prev) => Array.from(new Set([...prev, 'happy-gallery'])));
      saveTeleport24hNavState({
        visitedSections: ['happy-gallery'],
        lastActiveSection: 'happy-gallery',
      });
    } else if (stage === 'qna') {
      const isFinal = qnaCurrentStep === 'final-message';
      const toAdd = isFinal ? ['qna', 'qna-final'] : ['qna'];
      setVisitedSections((prev) => Array.from(new Set([...prev, ...toAdd])));
      saveTeleport24hNavState({
        visitedSections: toAdd,
        lastActiveSection: 'qna',
        navigationProgress: { qnaStep: qnaCurrentStep },
      });
    } else if (stage === 'fireworks') {
      saveTeleport24hNavState({
        lastActiveSection: 'fireworks',
        fireworksUnlocked: true,
        secondCountdownCompleted: true,
      });
    }
  }, [stage, qnaCurrentStep, sadGalleryState]);

  // TELEPORT_24H_NAV: Direct Teleport navigation handler
  const handleTeleportToSection = useCallback((sectionId) => {
    if (sectionId === 'fireworks-replay') {
      handleClickAndSee();
      return;
    }

    if (sectionId === 'main') {
      if (stage !== 'main') setStage('main');
    } else if (sectionId === 'sad-memories') {
      if (stage !== 'sad-memories') setStage('sad-memories');
    } else if (sectionId === 'happy-gallery') {
      if (stage !== 'happy-gallery') setStage('happy-gallery');
    } else if (sectionId === 'qna') {
      setQnaInitialStep('question');
      if (stage !== 'qna') {
        audioController.startQnaPlayback();
        setStage('qna');
      }
    } else if (sectionId === 'qna-final') {
      setQnaInitialStep('final-message');
      if (stage !== 'qna') {
        audioController.startQnaPlayback();
        setStage('qna');
      }
    }
  }, [stage]);

  // Current active section id for Teleport indicator
  const currentNavSectionId = (() => {
    if (stage === 'main') return 'main';
    if (stage === 'sad-memories') return 'sad-memories';
    if (stage === 'happy-gallery') return 'happy-gallery';
    if (stage === 'qna') {
      return qnaCurrentStep === 'final-message' ? 'qna-final' : 'qna';
    }
    if (stage === 'fireworks') return 'fireworks-replay';
    return 'countdown';
  })();

  // TELEPORT_24H_NAV: Controls visibility in top-right cluster
  // When TELEPORT_24H_NAV is OFF:
  // - Teleport is hidden everywhere.
  // - Original Click & See Magic rules are restored (Fireworks page, and Main Birthday after countdown).
  // When TELEPORT_24H_NAV is ON:
  // - Stage A: Before second countdown completes -> Neither Click & See nor Teleport
  // - Stage B: Fireworks page -> Standalone Click & See Magic
  // - Stage C: Main Birthday before Teleport unlock -> Standalone Click & See Magic
  // - Stages D, E, F, G & re-entering Main Birthday -> Teleport dropdown (Click & See is option 1 inside)
  const showClickAndSeeStandalone = !teleportNavEnabledState
    ? (stage === 'fireworks' || (stage === 'main' && (secondCountdownCompleted || celebrationSignal > 0)))
    : (stage === 'fireworks' ||
       (stage === 'main' && !teleportUnlocked && (secondCountdownCompleted || celebrationSignal > 0)));

  const showTeleportDropdown =
    teleportNavEnabledState && teleportUnlocked && stage !== 'countdown' && stage !== 'fireworks';

  // Replay from start
  const handleReplay = useCallback(() => {
    setCelebrationSignal(0);
    setStage('countdown');
  }, []);

  // ---------------------------------------------------------------------------
  // 2. DEV TEST HELPER ACTIONS (STRICTLY ISOLATED)
  // ---------------------------------------------------------------------------

  // "Click & See" Action:
  // Starts a 10-second countdown on the rooftop leading into the full fireworks + welcome song celebration
  // without modifying or corrupting real configured countdown targets in config.js
  const handleClickAndSee = useCallback(() => {
    audioController.resetWelcomeSongSession();
    setCelebrationSignal(0);
    const future = new Date(Date.now() + 10 * 1000);
    setFirecrackerTargetDate(future.toISOString());
    setSecondCountdownCompleted(true);
    setStage('fireworks');
    saveTeleport24hNavState({
      lastActiveSection: 'fireworks',
      secondCountdownCompleted: true,
      fireworksUnlocked: true,
    });
  }, []);

  // Test Option A: Cover Timer Test (Simulates Timer 1 reaching zero)
  // Action: Cover -> Firecracker page. Timer 2 visible in normal state; zero fireworks.
  const handleTestCoverTimer = useCallback(() => {
    handleCoverTimerComplete();
  }, [handleCoverTimerComplete]);

  // Test Option B: Firecracker Timer Test (Simulates Timer 2 reaching zero)
  // Action: Launches colorful crackers/fireworks in open sky, heart button active, waits for 1st click (Happy Birthday) and 2nd click (Main page)
  const handleTestFirecrackerTimer = useCallback(() => {
    audioController.resetWelcomeSongSession();
    handleFirecrackerTimerComplete();
  }, [handleFirecrackerTimerComplete]);

  // Direct section previews
  const handleJumpToCountdown = useCallback(() => {
    setCelebrationSignal(0);
    setStage('countdown');
  }, []);

  const handleJumpToFireworksPage = useCallback(() => {
    audioController.resetWelcomeSongSession();
    setCelebrationSignal(0);
    setFirecrackerTargetDate(BIRTHDAY_CONFIG.firecrackerTargetDate || BIRTHDAY_CONFIG.targetDate || null);
    setStage('fireworks');
  }, []);

  const handleJumpToMainPage = useCallback(() => {
    setStage('main');
  }, []);

  const handleJumpToSadMemories = useCallback(() => {
    setStage('sad-memories');
  }, []);

  const handleJumpToHappyGallery = useCallback(() => {
    setStage('happy-gallery');
  }, []);

  // Live 5s Countdown Tests
  const handleTriggerCover5sCountdown = useCallback(() => {
    setCelebrationSignal(0);
    setStage('countdown');
    const testSeconds = BIRTHDAY_CONFIG.dev.testCountdownDurationSeconds || 5;
    const futureCover = new Date(Date.now() + testSeconds * 1000);
    const futureFirecracker = new Date(Date.now() + testSeconds * 2 * 1000);
    setCoverTargetDate(futureCover.toISOString());
    setFirecrackerTargetDate(futureFirecracker.toISOString());
  }, []);

  const handleTriggerFirecracker5sCountdown = useCallback(() => {
    audioController.resetWelcomeSongSession();
    setStage('fireworks');
    setCelebrationSignal(0);
    const future = new Date(Date.now() + (BIRTHDAY_CONFIG.dev.testCountdownDurationSeconds || 5) * 1000);
    setFirecrackerTargetDate(future.toISOString());
  }, []);

  // Reset to Clean Config
  const handleResetToDefaultConfig = useCallback(() => {
    clearTeleport24hNavState();
    setTeleportUnlocked(false);
    setVisitedSections([]);
    setSecondCountdownCompleted(false);
    audioController.resetWelcomeSongSession();
    const state = computeInitialExperienceState();
    setCoverTargetDate(getInitialCoverTarget());
    setFirecrackerTargetDate(getInitialFirecrackerTarget());
    setCelebrationSignal(state.celebrationSignal);
    setStage(state.stage);
  }, []);

  // Get active stage background information for the "See This View" fullscreen background viewer
  const getActiveStageBackground = () => {
    switch (stage) {
      case 'countdown':
        return {
          src: BIRTHDAY_CONFIG.countdownPage?.background || '/final-countdown.png',
          alt: 'Birthday countdown background',
        };
      case 'fireworks':
        return {
          src: BIRTHDAY_CONFIG.cover?.backgroundImage || BIRTHDAY_CONFIG.images?.fireworksRooftopBg || '/cover.png',
          alt: 'Romantic rooftop balcony overlooking twilight sky',
        };
      case 'main':
        return {
          src: BIRTHDAY_CONFIG.images?.mainBirthdayBg || BIRTHDAY_CONFIG.images?.desktopBackground || '/background.png',
          alt: 'Sunset terrace background',
        };
      case 'sad-memories':
        return {
          src: BIRTHDAY_CONFIG.sadGallery?.background || '/sad.png',
          alt: 'Sad memories moonlit background',
        };
      case 'happy-gallery':
        return {
          src: BIRTHDAY_CONFIG.happyGallery?.background || '/happy-gallery.png',
          alt: 'Happy gallery sunset background',
        };
      case 'qna':
        return {
          src: BIRTHDAY_CONFIG.qna?.background || BIRTHDAY_CONFIG.qna?.image || BIRTHDAY_CONFIG.images?.qnaBackground || '/QNA-image.png',
          alt: 'Q&A scenic nature background',
        };
      default:
        return null;
    }
  };

  const activeStageBg = getActiveStageBackground();

  // When opened on a mobile phone or tablet, strictly display the dedicated Mobile Information Screen
  if (isMobileOrTablet) {
    return <MobileInfoScreen />;
  }

  return (
    <div className="surprise-app-container">
      {/* Top-Right Utility Cluster: Shared flex container for See This View, Click & See Magic, Teleport, and DevControls (dev-only) */}
      <div className="top-right-controls-cluster">
        {activeStageBg && (
          <SeeThisView
            backgroundImage={activeStageBg.src}
            alt={activeStageBg.alt}
          />
        )}

        {/* TELEPORT_24H_NAV: Standalone Click & See Magic button */}
        {/* Visible ONLY on Fireworks page, OR on Main Birthday before Teleport is unlocked */}
        {showClickAndSeeStandalone && (
          <button
            type="button"
            onClick={handleClickAndSee}
            className="dev-panel-toggle-btn dev-click-see-btn"
            aria-label="Click & See Magic"
            title="Preview 10s countdown to full fireworks celebration"
          >
            <Sparkles className="w-4 h-4 text-amber-300 mr-1.5" />
            <span>Click &amp; See Magic</span>
          </button>
        )}

        {/* TELEPORT_24H_NAV: Persistent Teleport Dropdown */}
        {/* Visible once Sad Gallery has been visited, across all subsequent sections */}
        {showTeleportDropdown && (
          <TeleportDropdown
            visitedSections={visitedSections}
            currentSection={currentNavSectionId}
            onSelectSection={handleTeleportToSection}
            onReplayFireworks={handleClickAndSee}
          />
        )}

        <DevControls
          currentStage={stage}
          onTestCoverTimer={handleTestCoverTimer}
          onTestFirecrackerTimer={handleTestFirecrackerTimer}
          onJumpToCountdown={handleJumpToCountdown}
          onJumpToFireworksPage={handleJumpToFireworksPage}
          onJumpToMainPage={handleJumpToMainPage}
          onJumpToSadMemories={handleJumpToSadMemories}
          onJumpToHappyGallery={handleJumpToHappyGallery}
          onJumpToQnA={handleOpenQnA}
          onTriggerCover5sCountdown={handleTriggerCover5sCountdown}
          onTriggerFirecracker5sCountdown={handleTriggerFirecracker5sCountdown}
          onResetToDefaultConfig={handleResetToDefaultConfig}
          onToggleTeleportNav={(enabled) => setTeleportNavEnabledState(enabled)}
        />
      </div>

      {/* STAGE 1: Blurred Countdown / Cover Page (Timer 1) */}
      {stage === 'countdown' && (
        <BirthdayCountdownPage
          targetDate={coverTargetDate}
          onCountdownComplete={handleCoverTimerComplete}
        />
      )}

      {/* STAGE 2: Firecracker & Rooftop Fireworks Page (Timer 2) */}
      {stage === 'fireworks' && (
        <CoverPage
          targetDate={firecrackerTargetDate}
          celebrationSignal={celebrationSignal}
          onProceedToMain={handleHeartButtonClick}
        />
      )}

      {/* STAGE 3: Main Birthday Page */}
      {stage === 'main' && (
        <MainPage
          onReplay={handleReplay}
          onOpenMemories={handleOpenSadMemories}
          onOpenHappyGallery={handleOpenHappyGallery}
          initialSectionIndex={mainPageSectionIndex}
          onSectionChange={handleMainSectionChange}
        />
      )}

      {/* STAGE 4: Sad Image Gallery */}
      {stage === 'sad-memories' && (
        <SadMemoriesGallery
          onBack={handleBackToMainLastSection}
          onPreviousSection={handleBackToMainLastSection}
          onNextPage={handleOpenHappyGallery}
          initialView={sadGalleryState.view}
          initialPhotoIndex={sadGalleryState.photoIndex}
          onStateChange={handleSadGalleryStateChange}
        />
      )}

      {/* STAGE 5: Happy Memories Gallery */}
      {stage === 'happy-gallery' && (
        <HappyMemoriesGallery
          onBack={handleBackToSadGallery}
          onPreviousPage={handleBackToSadGallery}
          onNextPage={handleOpenQnA}
        />
      )}

      {/* STAGE 6: Q&A Section */}
      {stage === 'qna' && (
        <QnASection
          onPreviousPage={handleBackFromQnAToHappyGallery}
          onBackToHappyGallery={handleBackFromQnAToHappyGallery}
          initialStep={qnaInitialStep}
          initialQuestionIndex={qnaInitialQuestionIndex}
          onProgressChange={handleQnAProgressChange}
        />
      )}
    </div>
  );
}
