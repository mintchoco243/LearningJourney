"use client";

import React from "react";
import { GLH_DATA } from '@/data/glhData';

const D = GLH_DATA;


  const KEY = "glh_user_v1";

  const DEFAULT_USER = {
    onboarded: false,
    email: "",
    full_name: "",
    db_role: "",   // role from DB (pre-populated by admin)
    db_team: "",   // team/department from DB (pre-populated by admin)
    db_rank: "",   // rank from DB (rank_id or imported label)
    character: { hair: "short", outfit: "red", accessory: "none", skin: "s1" },
    quiz_result: null, // { class_id, rank_id, personality, completed_at }
    quiz_extended: null, // { learning_style[], availability, trainers[] }
    xp: 0,
    completed_courses: [],
    registered_events: [],
    unlocked_skills: [], // skill ids unlocked beyond quiz baseline
    badges: [],
    last_seen: null,
  };

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return Object.assign({}, DEFAULT_USER, JSON.parse(raw));
    } catch (e) { return null; }
  }
  function save(u) {
    try { localStorage.setItem(KEY, JSON.stringify(u)); } catch (e) {}
  }
  function clearUser() { try { localStorage.removeItem(KEY); } catch (e) {} }

  /* ---------- profile rank ---------- */
  function rankForUser(user = {}) {
    return D.RANKS.find((r) => r.id === (user.db_rank || user.quiz_result?.rank_id)) || D.RANKS[0];
  }

  /* ---------- quiz scoring ---------- */
  // answers: array of chosen option objects (in question order)
  function scoreQuiz(answers) {
    const clsTally = {};
    const persTally = {};
    let rankSum = 0, rankCount = 0;
    answers.forEach((opt) => {
      if (!opt) return;
      if (opt.cls) clsTally[opt.cls] = (clsTally[opt.cls] || 0) + 1;
      if (opt.pers) persTally[opt.pers] = (persTally[opt.pers] || 0) + 1;
      if (opt.rank) { rankSum += opt.rank; rankCount += 1; }
    });
    const topKey = (t, fallback) => {
      let best = fallback, bestN = -1;
      Object.keys(t).forEach((k) => { if (t[k] > bestN) { bestN = t[k]; best = k; } });
      return best;
    };
    const class_id = topKey(clsTally, "explorer");
    const personality = topKey(persTally, "explorer");
    // average rank weight -> starting rank index (cap so beginners don't start at master)
    const avg = rankCount ? rankSum / rankCount : 1;
    let ri = Math.round(avg) - 1;            // 0-based
    ri = Math.max(0, Math.min(D.RANKS.length - 2, ri)); // never start at final rank
    const rank = D.RANKS[ri];
    return {
      class_id,
      personality,
      rank_id: rank.id,
      start_xp: D.XP.quiz_complete,
      completed_at: new Date().toISOString(),
    };
  }

  /* ---------- skills / constellation ---------- */
  // A skill is COMPLETED if the user finished a related course OR it was unlocked.
  // It is CURRENT if it belongs to the user's current rank tier frontier.
  function skillStatus(user) {
    const completedCourses = new Set(user.completed_courses || []);
    const status = {};
    const done = {};
    D.SKILLS.forEach((s) => {
      const isDone =
        s.tier === 1 || // foundations always lit
        (s.courses || []).some((c) => completedCourses.has(c)) ||
        (user.unlocked_skills || []).includes(s.id);
      done[s.id] = isDone;
    });
    // build adjacency from edges
    const adj = {};
    D.SKILL_EDGES.forEach((e) => {
      (adj[e[0]] = adj[e[0]] || []).push(e[1]);
      (adj[e[1]] = adj[e[1]] || []).push(e[0]);
    });
    D.SKILLS.forEach((s) => {
      if (done[s.id]) { status[s.id] = "done"; return; }
      // frontier: adjacent to any done skill => ready to learn (current)
      const reachable = (adj[s.id] || []).some((n) => done[n]);
      status[s.id] = reachable ? "current" : "locked";
    });
    return status;
  }

  /* ---------- recommendations ---------- */
  function recommendCourses(user, limit) {
    if (!user.quiz_result) return D.COURSES.slice(0, limit || 3);
    const cls = user.quiz_result.class_id;
    const curRank = rankForUser(user);
    const done = new Set(user.completed_courses || []);
    const scored = D.COURSES
      .filter((c) => !done.has(c.course_id))
      .map((c) => {
        let score = 0;
        if ((c.class_ids || []).includes(cls)) score += 3;
        if ((c.rank_ids || []).includes(curRank.id)) score += 2;
        return { c, score };
      })
      .sort((a, b) => b.score - a.score);
    return scored.slice(0, limit || 3).map((x) => x.c);
  }
  function isRecommended(course, user) {
    if (!user.quiz_result) return false;
    const cls = user.quiz_result.class_id;
    const curRank = rankForUser(user);
    return (course.class_ids || []).includes(cls) &&
      (course.rank_ids || []).includes(curRank.id);
  }

  function upcomingEvents(limit) {
    const today = new Date("2026-06-05");
    return D.CALENDAR
      .filter((e) => new Date(e.start_date) >= today)
      .sort((a, b) => new Date(a.start_date) - new Date(b.start_date))
      .slice(0, limit || 3);
  }

  /* ---------- React provider/hook ---------- */
  export const GameContext = React.createContext(null);

  export function GameProvider(props) {
    const [user, setUser] = React.useState(() => load() || Object.assign({}, DEFAULT_USER));
    // xpBurst: a transient {amount} for the XP gain toast
    const [xpBurst, setXpBurst] = React.useState(null);

    const persist = React.useCallback((next) => { setUser(next); save(next); }, []);

    const actions = React.useMemo(() => ({
      reset() { clearUser(); persist(Object.assign({}, DEFAULT_USER)); },
      setEmail(email) { persist(Object.assign({}, user, { email, onboarded: true })); },
      setUserProfile(profile) {
        persist(Object.assign({}, user, {
          email: profile.email || user.email,
          full_name: profile.full_name || user.full_name,
          db_role: profile.role || user.db_role,
          db_team: profile.team || user.db_team,
          db_rank: profile.rank || user.db_rank,
          onboarded: true,
        }));
      },
      setCharacter(character) { persist(Object.assign({}, user, { character })); },
      finishOnboarding() { persist(Object.assign({}, user, { onboarded: true })); },
      completeQuiz(result) {
        persist(Object.assign({}, user, {
          quiz_result: result,
          xp: result.start_xp,
          badges: Array.from(new Set([...(user.badges || []), "first_quest"])),
          last_seen: new Date().toISOString(),
        }));
      },
      addXp(amount, label) {
        const nextXp = (user.xp || 0) + amount;
        persist(Object.assign({}, user, { xp: nextXp }));
        setXpBurst({ amount, label, id: Date.now() });
      },
      completeCourse(course) {
        if ((user.completed_courses || []).includes(course.course_id)) return false;
        const nextXp = (user.xp || 0) + (course.xp_reward || D.XP.course_complete_default);
        persist(Object.assign({}, user, {
          xp: nextXp,
          completed_courses: [...(user.completed_courses || []), course.course_id],
        }));
        setXpBurst({ amount: course.xp_reward || 20, label: "Hoàn thành khóa học", id: Date.now() });
        // Persist to backend (fire-and-forget — local state already updated)
        const apiCourseId = course._id || course.course_id;
        if (apiCourseId) {
          fetch("/api/courses/" + apiCourseId + "/complete", { method: "POST", credentials: "include" }).catch(() => {});
        }
        return true;
      },
      reserveCourseSession(course) {
        const sessionId = course.session_id;
        if (!sessionId || (user.registered_events || []).includes(sessionId)) return false;
        const nextXp = (user.xp || 0) + D.XP.event_register;
        persist(Object.assign({}, user, {
          xp: nextXp,
          registered_events: [...(user.registered_events || []), sessionId],
        }));
        setXpBurst({ amount: D.XP.event_register, label: "Đăng ký khóa học", id: Date.now() });
        fetch("/api/sessions/" + sessionId + "/reserve", { method: "POST", credentials: "include" }).catch(() => {});
        return true;
      },
      registerEvent(ev) {
        if ((user.registered_events || []).includes(ev.event_id)) return false;
        const nextXp = (user.xp || 0) + D.XP.event_register;
        persist(Object.assign({}, user, {
          xp: nextXp,
          registered_events: [...(user.registered_events || []), ev.event_id],
        }));
        setXpBurst({ amount: D.XP.event_register, label: "Đăng ký sự kiện", id: Date.now() });
        // Persist to backend (fire-and-forget)
        if (ev.event_id) {
          fetch("/api/sessions/" + ev.event_id + "/reserve", { method: "POST", credentials: "include" }).catch(() => {});
        }
        return true;
      },
      clearXpBurst() { setXpBurst(null); },
    }), [user, persist]);

    const value = { user, actions, xpBurst };
    return React.createElement(GameContext.Provider, { value }, props.children);
  }

  export function useGame() {
    const ctx = React.useContext(GameContext);
    if (!ctx) throw new Error("useGame must be inside GameProvider");
    return ctx;
  }

  export const GLHEngine = {
    DEFAULT_USER, load, save, clearUser,
    rankForUser,
    scoreQuiz, skillStatus, recommendCourses, isRecommended, upcomingEvents,
    GameProvider, useGame,
  };
