'use client';

import { useState, useCallback, useReducer } from 'react';
import { AuthMachineState, AuthMachineContext, AuthSuccess, LinkNeededInfo, AuthError } from '../types';

// Action types for the state machine
type AuthAction = 
  | { type: 'START_PHONE_AUTH' }
  | { type: 'START_EMAIL_AUTH' }
  | { type: 'AUTH_SUCCESS'; payload: AuthSuccess }
  | { type: 'AUTH_FAILURE'; payload: AuthError }
  | { type: 'LINK_NEEDED'; payload: LinkNeededInfo }
  | { type: 'LINK_RESOLVED' }
  | { type: 'RESET' }
  | { type: 'SET_ERROR'; payload: AuthError };

// Initial state
const initialState: AuthMachineContext = {
  currentState: 'IDLE',
  user: undefined,
  error: undefined,
  linkInfo: undefined
};

// State machine reducer
function authMachineReducer(state: AuthMachineContext, action: AuthAction): AuthMachineContext {
  switch (action.type) {
    case 'START_PHONE_AUTH':
      return {
        ...state,
        currentState: 'AUTH_PHONE',
        error: undefined
      };

    case 'START_EMAIL_AUTH':
      return {
        ...state,
        currentState: 'AUTH_EMAIL',
        error: undefined
      };

    case 'AUTH_SUCCESS':
      return {
        ...state,
        currentState: 'DONE',
        user: action.payload.user,
        error: undefined,
        linkInfo: undefined
      };

    case 'AUTH_FAILURE':
      return {
        ...state,
        currentState: 'ERROR',
        error: action.payload
      };

    case 'LINK_NEEDED':
      return {
        ...state,
        currentState: 'LINK_RESOLVE',
        linkInfo: action.payload
      };

    case 'LINK_RESOLVED':
      return {
        ...state,
        currentState: 'DONE',
        linkInfo: undefined
      };

    case 'RESET':
      return initialState;

    case 'SET_ERROR':
      return {
        ...state,
        currentState: 'ERROR',
        error: action.payload
      };

    default:
      return state;
  }
}

export function useAuthMachine() {
  const [state, dispatch] = useReducer(authMachineReducer, initialState);

  // Start phone authentication
  const startPhoneAuth = useCallback(() => {
    dispatch({ type: 'START_PHONE_AUTH' });
  }, []);

  // Start email authentication
  const startEmailAuth = useCallback(() => {
    dispatch({ type: 'START_EMAIL_AUTH' });
  }, []);

  // Handle authentication success
  const handleAuthSuccess = useCallback((result: AuthSuccess) => {
    dispatch({ type: 'AUTH_SUCCESS', payload: result });
  }, []);

  // Handle authentication failure
  const handleAuthFailure = useCallback((error: AuthError) => {
    dispatch({ type: 'AUTH_FAILURE', payload: error });
  }, []);

  // Handle linking needed
  const handleLinkNeeded = useCallback((linkInfo: LinkNeededInfo) => {
    dispatch({ type: 'LINK_NEEDED', payload: linkInfo });
  }, []);

  // Resolve linking
  const resolveLinking = useCallback(() => {
    dispatch({ type: 'LINK_RESOLVED' });
  }, []);

  // Reset the machine
  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Set error manually
  const setError = useCallback((error: AuthError) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  // Check if we can transition to a specific state
  const canTransitionTo = useCallback((targetState: AuthMachineState): boolean => {
    const validTransitions: Record<AuthMachineState, AuthMachineState[]> = {
      'IDLE': ['AUTH_PHONE', 'AUTH_EMAIL'],
      'AUTH_PHONE': ['DONE', 'ERROR', 'LINK_RESOLVE'],
      'AUTH_EMAIL': ['DONE', 'ERROR', 'LINK_RESOLVE'],
      'LINK_RESOLVE': ['DONE', 'ERROR'],
      'DONE': ['IDLE', 'AUTH_PHONE', 'AUTH_EMAIL'],
      'ERROR': ['IDLE', 'AUTH_PHONE', 'AUTH_EMAIL']
    };

    return validTransitions[state.currentState]?.includes(targetState) || false;
  }, [state.currentState]);

  // Get next possible states
  const getNextPossibleStates = useCallback((): AuthMachineState[] => {
    const validTransitions: Record<AuthMachineState, AuthMachineState[]> = {
      'IDLE': ['AUTH_PHONE', 'AUTH_EMAIL'],
      'AUTH_PHONE': ['DONE', 'ERROR', 'LINK_RESOLVE'],
      'AUTH_EMAIL': ['DONE', 'ERROR', 'LINK_RESOLVE'],
      'LINK_RESOLVE': ['DONE', 'ERROR'],
      'DONE': ['IDLE', 'AUTH_PHONE', 'AUTH_EMAIL'],
      'ERROR': ['IDLE', 'AUTH_PHONE', 'AUTH_EMAIL']
    };

    return validTransitions[state.currentState] || [];
  }, [state.currentState]);

  // Check if machine is in a specific state
  const isInState = useCallback((targetState: AuthMachineState): boolean => {
    return state.currentState === targetState;
  }, [state.currentState]);

  // Check if machine is in any of the given states
  const isInAnyState = useCallback((targetStates: AuthMachineState[]): boolean => {
    return targetStates.includes(state.currentState);
  }, [state.currentState]);

  // Check if machine is in a terminal state
  const isTerminal = useCallback((): boolean => {
    return ['DONE', 'ERROR'].includes(state.currentState);
  }, [state.currentState]);

  // Check if machine is in an active authentication state
  const isAuthenticating = useCallback((): boolean => {
    return ['AUTH_PHONE', 'AUTH_EMAIL'].includes(state.currentState);
  }, [state.currentState]);

  // Check if machine needs linking resolution
  const needsLinking = useCallback((): boolean => {
    return state.currentState === 'LINK_RESOLVE';
  }, [state.currentState]);

  return {
    // Current state
    currentState: state.currentState,
    user: state.user,
    error: state.error,
    linkInfo: state.linkInfo,

    // Actions
    startPhoneAuth,
    startEmailAuth,
    handleAuthSuccess,
    handleAuthFailure,
    handleLinkNeeded,
    resolveLinking,
    reset,
    setError,

    // State checks
    canTransitionTo,
    getNextPossibleStates,
    isInState,
    isInAnyState,
    isTerminal,
    isAuthenticating,
    needsLinking,

    // Computed values
    isIdle: state.currentState === 'IDLE',
    isDone: state.currentState === 'DONE',
    isError: state.currentState === 'ERROR',
    canStartAuth: ['IDLE', 'DONE', 'ERROR'].includes(state.currentState),
    canReset: state.currentState !== 'IDLE'
  };
}
