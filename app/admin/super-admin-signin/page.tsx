'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { checkAdminAuthHealth, getCachedAdminAuthStatus } from '@/lib/shared-health-check';

export default function SuperAdminSignInPage() {
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  const [returnTo, setReturnTo] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
    // Get returnTo parameter from URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const returnToParam = params.get('returnTo');
      if (returnToParam) {
        setReturnTo(decodeURIComponent(returnToParam));
      }
    }
  }, []);

  if (!isClient) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '600px',
      margin: '50px auto',
      padding: '20px',
      background: '#f5f5f5',
      minHeight: '100vh'
    }}>
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ marginTop: 0, color: '#333' }}>🔐 Super Admin Sign-In</h1>
        <p style={{ color: '#666' }}>Local Development Test</p>

        <div id="error" style={{
          background: '#fee',
          color: '#c33',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'none'
        }}></div>
        <div id="success" style={{
          background: '#efe',
          color: '#3c3',
          padding: '10px',
          borderRadius: '4px',
          marginBottom: '20px',
          display: 'none'
        }}></div>

        <div id="serviceInfo" style={{
          background: '#e7f3ff',
          padding: '15px',
          borderRadius: '4px',
          marginBottom: '20px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <strong>⚠️ Local Development Mode</strong><br />
          This is for testing only. Make sure:<br />
          • Admin-auth service is running on <code>http://localhost:8443</code><br />
          • <code>LOCAL_DEV=true</code> is set in your environment<br />
          • You have a hardware key (YubiKey, Touch ID, etc.) or browser supports WebAuthn<br />
          <span id="serviceStatus" style={{ marginTop: '8px', display: 'block' }}>
            <span style={{ color: '#dc3545' }}>🔴 Checking service status...</span>
            <button 
              onClick={() => {
                // Force refresh by reloading with refresh parameter
                window.location.href = window.location.pathname + '?refresh=true';
              }}
              style={{ 
                marginLeft: '10px', 
                padding: '4px 8px', 
                fontSize: '11px', 
                background: '#0B4422', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
              title="Refresh service status"
            >
              🔄 Refresh
            </button>
          </span>
        </div>

        {/* Create Super Admin Section */}
        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
          <h2>0. Create Super Admin Account</h2>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            If you don't have a super admin account yet, create one first:
          </p>

          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
            <strong>Option 1: Quick SQL (Recommended for Testing)</strong><br />
            Run this in Supabase SQL Editor:
            <div style={{ marginTop: '10px', marginBottom: '10px' }}>
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email:</label>
              <input 
                type="email" 
                id="sqlEmail" 
                placeholder="admin@example.com" 
                style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
              />
              <label style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Full Name:</label>
              <input 
                type="text" 
                id="sqlName" 
                placeholder="Test Admin" 
                style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
              />
            </div>
            <button 
              id="copySQLBtn"
              style={{ padding: '6px 12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
            >
              📋 Copy SQL
            </button>
            <div id="sqlPreview" style={{
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              marginTop: '10px',
              fontFamily: 'monospace',
              fontSize: '11px',
              display: 'none',
              whiteSpace: 'pre-wrap',
              overflowX: 'auto'
            }}></div>
          </div>

          <div style={{ background: '#e7f3ff', padding: '15px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
            <strong>Option 2: Using CLI</strong><br />
            <div style={{ marginTop: '10px' }}>
              <label htmlFor="createEmail" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Email:</label>
              <input 
                type="email" 
                id="createEmail" 
                placeholder="admin@example.com" 
                style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
              />
            </div>
            <div>
              <label htmlFor="createName" style={{ fontSize: '13px', display: 'block', marginBottom: '4px' }}>Full Name:</label>
              <input 
                type="text" 
                id="createName" 
                placeholder="Test Admin" 
                style={{ width: '100%', padding: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }} 
              />
            </div>
            <button 
              id="showCLIBtn"
              style={{ padding: '8px 16px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
            >
              📝 Show CLI Commands
            </button>
            <div id="cliInstructions" style={{
              marginTop: '10px',
              display: 'none',
              background: '#f8f9fa',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '12px',
              whiteSpace: 'pre-wrap'
            }}></div>
          </div>
        </div>

        {/* Registration Section */}
        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
          <h2>1. Register WebAuthn (First Time)</h2>
          <p style={{ color: '#666', fontSize: '14px' }}>If you haven't registered your hardware key yet:</p>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="registerEmail" style={{ display: 'block', marginBottom: '5px', fontWeight: 500, color: '#555' }}>Email:</label>
            <input 
              type="email" 
              id="registerEmail" 
              placeholder="admin@example.com" 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <button 
            id="registerBtn"
            type="button"
            style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px', opacity: '1' }}
          >
            Register Hardware Key
          </button>
        </div>

        {/* Sign-In Section */}
        <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
          <h2>2. Sign In</h2>
          
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="signinEmail" style={{ display: 'block', marginBottom: '5px', fontWeight: 500, color: '#555' }}>Email:</label>
            <input 
              type="email" 
              id="signinEmail" 
              placeholder="admin@example.com" 
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', boxSizing: 'border-box' }} 
            />
          </div>

          <button 
            id="signinBtn"
            type="button"
            style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px', opacity: '1' }}
          >
            Sign In with WebAuthn
          </button>
        </div>

        {/* Session Info */}
        <div id="sessionInfo" style={{
          background: '#f9f9f9',
          padding: '15px',
          borderRadius: '4px',
          marginTop: '20px',
          fontFamily: 'monospace',
          fontSize: '12px',
          wordBreak: 'break-all',
          display: 'none'
        }}></div>

        {/* Verify Session Section */}
        <div id="verifySection" style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee', display: 'none' }}>
          <h2>3. Verify Session</h2>
          <button 
            id="verifyBtn"
            style={{ width: '100%', padding: '12px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
          >
            Verify Current Session
          </button>
          <button 
            id="logoutBtn"
            style={{ width: '100%', padding: '12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer', marginTop: '10px' }}
          >
            Logout
          </button>
        </div>
      </div>

      <SuperAdminScript router={router} returnTo={returnTo} />
    </div>
  );
}

// Global flags to prevent multiple instances from polling (persists across component re-mounts)
// These persist across ALL component instances and re-renders
// CRITICAL: Module-level lock that's checked synchronously BEFORE any useEffect runs
let globalHealthCheckLock = false; // Synchronous lock - set immediately when check starts
let globalHealthCheckPromise: Promise<any> | null = null; // Share the same promise across all instances

// Global flag to prevent multiple simultaneous WebAuthn operations
// This prevents "A request is already pending" errors
let globalWebAuthnOperationInProgress = false;

function SuperAdminScript({ router, returnTo }: { router: ReturnType<typeof useRouter>; returnTo: string | null }) {
  // Use refs to persist values across re-renders
  const serviceConfirmedRunningRef = useRef(false);
  
  useEffect(() => {
    // CRITICAL: Only run if we're actually on the super-admin-signin page
    // Don't run during SSR or pre-rendering
    if (typeof window === 'undefined') {
      return;
    }
    
    const currentPath = window.location.pathname;
    if (!currentPath.includes('/admin/super-admin-signin')) {
      return;
    }
    
    console.log('🚀 [SuperAdminScript] useEffect running - setting up event listeners');
    
    // CRITICAL: Define all functions and attach event listeners FIRST
    // This ensures buttons work even if health check logic has early returns
    
    // Use Next.js API proxy to avoid CSP issues
    const API_BASE = '/api/admin-auth';

    function showError(msg: string) {
      const el = document.getElementById('error');
      if (!el) return;
      // Use innerHTML to support HTML formatting (like <br> for line breaks)
      el.innerHTML = msg;
      el.style.display = 'block';
      setTimeout(() => el.style.display = 'none', 5000);
    }

    function showSuccess(msg: string) {
      const el = document.getElementById('success');
      if (!el) return;
      el.textContent = msg;
      el.style.display = 'block';
      setTimeout(() => el.style.display = 'none', 5000);
    }

    function setButtonsEnabled(enabled: boolean) {
      const registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;
      const signinBtn = document.getElementById('signinBtn') as HTMLButtonElement;
      const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement;
      const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
      
      if (registerBtn) {
        registerBtn.disabled = !enabled;
        registerBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        registerBtn.style.opacity = enabled ? '1' : '0.6';
      }
      if (signinBtn) {
        signinBtn.disabled = !enabled;
        signinBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        signinBtn.style.opacity = enabled ? '1' : '0.6';
      }
      if (verifyBtn) {
        verifyBtn.disabled = !enabled;
        verifyBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        verifyBtn.style.opacity = enabled ? '1' : '0.6';
      }
      if (logoutBtn) {
        logoutBtn.disabled = !enabled;
        logoutBtn.style.cursor = enabled ? 'pointer' : 'not-allowed';
        logoutBtn.style.opacity = enabled ? '1' : '0.6';
      }
      
      console.log(`🔘 Buttons ${enabled ? 'enabled' : 'disabled'}`);
    }

    // CRITICAL: Check module-level lock FIRST (synchronously, before any async operations)
    // This prevents React Strict Mode double-invocation from causing duplicate checks
    // BUT: Don't return early - we still need to attach event listeners!
    let skipHealthCheck = false;
    if (globalHealthCheckLock) {
      console.log('🔒 [Admin Auth] Health check lock is active - skipping health check (React Strict Mode protection)');
      skipHealthCheck = true;
      // If there's a pending promise, wait for it and update UI
      if (globalHealthCheckPromise) {
        globalHealthCheckPromise.then(result => {
          const statusEl = document.getElementById('serviceStatus');
          if (!statusEl) return;
          if (result.status === 'ok') {
            statusEl.innerHTML = '<span style="color: #28a745;">✅ Service is running</span>';
            serviceConfirmedRunningRef.current = true;
          }
        }).catch(() => {
          // Ignore - another instance handled it
        });
      }
    }
    
    // CRITICAL: Check sessionStorage synchronously (before any async operations)
    const SESSION_STORAGE_KEY = 'admin_auth_service_confirmed';
    const CHECK_EXECUTED_KEY = 'admin_auth_check_executed';
    
    // Check if user wants to force refresh (via URL parameter or manual refresh)
    const urlParams = new URLSearchParams(window.location.search);
    const forceRefresh = urlParams.get('refresh') === 'true';
    
    // If forcing refresh, clear cache and session storage
    if (forceRefresh) {
      try {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
        sessionStorage.removeItem(CHECK_EXECUTED_KEY);
        // Clear health check cache
        if (typeof window !== 'undefined' && (window as any).sharedHealthCheck) {
          (window as any).sharedHealthCheck.invalidateCache('admin-auth');
        }
      } catch (e) {
        // Ignore
      }
    }
    
    let wasConfirmed = false;
    let checkAlreadyExecuted = false;
    try {
      wasConfirmed = sessionStorage.getItem(SESSION_STORAGE_KEY) === 'true';
      checkAlreadyExecuted = sessionStorage.getItem(CHECK_EXECUTED_KEY) === 'true';
    } catch (e) {
      // If sessionStorage fails, continue with check (might be private browsing)
    }
    
    // Only use cached confirmation if not forcing refresh
    if (wasConfirmed && !forceRefresh) {
      serviceConfirmedRunningRef.current = true;
      const statusEl = document.getElementById('serviceStatus');
      if (statusEl) {
        statusEl.innerHTML = '<span style="color: #28a745;">✅ Service is running</span>';
      }
      // Don't return early - we still need to attach event listeners!
      // Continue to event listener attachment below
    } else if (checkAlreadyExecuted && !skipHealthCheck) {
      // CRITICAL: Check if we've already executed a check in this page session
      console.log('⏭️ [Admin Auth] Check already executed in this session - skipping health check');
      // Don't return early - we still need to attach event listeners!
      // Continue to event listener attachment below
    } else if (!skipHealthCheck) {
      // Only run health check if not skipped
      
      // CRITICAL: Set lock IMMEDIATELY (synchronously) to prevent any concurrent calls
      // This must happen before ANY async operations
      globalHealthCheckLock = true;
      try {
        sessionStorage.setItem(CHECK_EXECUTED_KEY, 'true');
      } catch (e) {
        // Ignore sessionStorage errors
      }
      
      console.log('🚀 [Admin Auth] Initializing health check (ONCE - only when page is visited)');
      
      // CRITICAL: Perform health check IMMEDIATELY after lock is set
      // This prevents React Strict Mode from causing duplicate checks
      // Check cached result first (from shared service)
      const cached = getCachedAdminAuthStatus();
      if (cached && cached.status === 'ok') {
        serviceConfirmedRunningRef.current = true;
        const statusEl = document.getElementById('serviceStatus');
        if (statusEl) {
          statusEl.innerHTML = '<span style="color: #28a745;">✅ Service is running</span>';
        }
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
        } catch (e) {
          // Ignore
        }
        console.log('✅ [Admin Auth] Using cached health check result');
        // Release lock after using cache
        globalHealthCheckLock = false;
      } else {
        // If there's already a global check in progress, wait for it
        if (globalHealthCheckPromise) {
          console.log('⏳ [Admin Auth] Waiting for existing health check promise...');
          // Safety timeout: Release lock after 10 seconds if promise never resolves
          const timeoutId = setTimeout(() => {
            globalHealthCheckLock = false;
            console.warn('⚠️ [Admin Auth] Health check promise timeout - releasing lock');
          }, 10000);
          
          globalHealthCheckPromise.then(result => {
            clearTimeout(timeoutId);
            globalHealthCheckLock = false; // Release lock
            const statusEl = document.getElementById('serviceStatus');
            if (!statusEl) return;
            
            if (result.status === 'ok') {
              statusEl.innerHTML = '<span style="color: #28a745;">✅ Service is running</span>';
              serviceConfirmedRunningRef.current = true;
              try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
              } catch (e) {
                // Ignore
              }
            }
          }).catch(() => {
            clearTimeout(timeoutId);
            globalHealthCheckLock = false; // Release lock on error
          });
        } else {
          // Perform ONE health check using shared service
          // Store the promise globally so other instances can wait for it
          console.log('🔍 [Admin Auth] Checking if admin-auth service is running on port 8443...');
          globalHealthCheckPromise = checkAdminAuthHealth();
          
          globalHealthCheckPromise.then(result => {
            globalHealthCheckLock = false; // Release lock when done
            globalHealthCheckPromise = null; // Clear promise when done
            const statusEl = document.getElementById('serviceStatus');
            if (!statusEl) return;

            if (result.status === 'ok') {
              statusEl.innerHTML = '<span style="color: #28a745;">✅ Service is running</span>';
              serviceConfirmedRunningRef.current = true;
              try {
                sessionStorage.setItem(SESSION_STORAGE_KEY, 'true');
              } catch (e) {
                // Ignore
              }
              console.log('✅ [Admin Auth] Service confirmed running - ready for authentication');
              // Ensure buttons are enabled when service is confirmed running
              setButtonsEnabled(true);
            } else {
              statusEl.innerHTML = `
                <span style="color: #dc3545;">❌ Service is NOT running</span><br>
                <span style="font-size: 12px; color: #666; margin-top: 4px; display: block;">
                  <strong>To start the service:</strong><br>
                  1. Open PowerShell/Terminal<br>
                  2. Navigate to: <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">cd admin-auth</code><br>
                  3. Run: <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 2px;">$env:LOCAL_DEV = "true"; node index.js</code><br>
                  4. Keep that terminal open and <strong>refresh this page</strong>
                </span>
              `;
              console.log('❌ [Admin Auth] Service not running - user needs to start it first');
              // Still enable buttons - let user try anyway (they might start service while page is open)
              setButtonsEnabled(true);
            }
          }).catch(err => {
            globalHealthCheckLock = false; // Release lock on error
            globalHealthCheckPromise = null; // Clear promise on error
            console.warn('⚠️ [Admin Auth] Health check failed:', err);
            const statusEl = document.getElementById('serviceStatus');
            if (statusEl) {
              statusEl.innerHTML = `
                <span style="color: #dc3545;">❌ Unable to check service status</span><br>
                <span style="font-size: 12px; color: #666; margin-top: 4px; display: block;">
                  Please ensure admin-auth service is running on port 8443
                </span>
              `;
            }
            // Enable buttons even if check failed - let user try anyway
            setButtonsEnabled(true);
          });
        }
      }
    }
    
    // Functions are already defined above - no need to redefine

    async function registerWebAuthn() {
      // CRITICAL: Prevent multiple simultaneous WebAuthn operations (module-level guard)
      // Check and set atomically to prevent race conditions
      if (globalWebAuthnOperationInProgress) {
        console.warn('⚠️ WebAuthn operation already in progress, ignoring duplicate request');
        return;
      }
      
      // Set flag IMMEDIATELY (synchronously) before any async operations
      globalWebAuthnOperationInProgress = true;

      const emailInput = document.getElementById('registerEmail') as HTMLInputElement;
      const email = emailInput?.value.trim();
      if (!email) {
        globalWebAuthnOperationInProgress = false; // Reset on early return
        showError('Please enter your email');
        return;
      }

      // Don't check service status here - let the user try and handle errors naturally
      setButtonsEnabled(false);
      try {
        const challengeRes = await fetch(`${API_BASE}/auth/webauthn/register-challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!challengeRes.ok) {
          const err = await challengeRes.json();
          
          // Check if service is unavailable
          if (challengeRes.status === 503 || err.error === 'Service unavailable') {
            const errorMsg = `❌ Admin-auth service is not running.\n\n` +
              `To start the service:\n` +
              `1. Open PowerShell/Terminal\n` +
              `2. Navigate to: cd admin-auth\n` +
              `3. Run: $env:LOCAL_DEV = "true"; node index.js\n` +
              `4. Keep that terminal open and refresh this page`;
            throw new Error(errorMsg);
          }
          
          throw new Error(err.error || err.message || 'Failed to get registration challenge');
        }

        const { options } = await challengeRes.json();
        
        // Debug: Log received options
        console.log('Received WebAuthn options:', options);
        console.log('Has pubKeyCredParams?', !!options.pubKeyCredParams);
        console.log('Has rp?', !!options.rp);
        console.log('Has user?', !!options.user);
        
        // Validate required fields
        if (!options.pubKeyCredParams || !Array.isArray(options.pubKeyCredParams)) {
          throw new Error('Missing pubKeyCredParams in server response. Make sure admin-auth service is restarted with the latest code.');
        }
        if (!options.rp || !options.rp.id) {
          throw new Error('Missing rp.id in server response. Make sure admin-auth service is restarted with the latest code.');
        }
        if (!options.user || !options.user.id) {
          throw new Error('Missing user.id in server response. Make sure admin-auth service is restarted with the latest code.');
        }
        
        // Convert base64url strings to ArrayBuffers
        if (options.challenge) {
          options.challenge = base64urlToBuffer(options.challenge);
        }
        // Convert user.id to ArrayBuffer (should be UUID string)
        if (options.user && options.user.id) {
          if (typeof options.user.id === 'string') {
            const encoder = new TextEncoder();
            options.user.id = encoder.encode(options.user.id).buffer;
          }
        }
        if (options.excludeCredentials && Array.isArray(options.excludeCredentials)) {
          options.excludeCredentials = options.excludeCredentials.map((cred: any) => ({
            ...cred,
            id: typeof cred.id === 'string' ? base64urlToBuffer(cred.id) : cred.id
          }));
        }

        console.log('Final WebAuthn options before create:', { 
          ...options, 
          challenge: '[ArrayBuffer]', 
          user: options.user ? { ...options.user, id: '[ArrayBuffer]' } : null
        });

        const credential = await navigator.credentials.create({
          publicKey: options
        }) as PublicKeyCredential;

        const credentialForAPI = {
          id: bufferToBase64url(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: bufferToBase64url((credential.response as any).attestationObject),
            clientDataJSON: bufferToBase64url((credential.response as any).clientDataJSON)
          }
        };

        const verifyRes = await fetch(`${API_BASE}/auth/webauthn/register-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, credential: credentialForAPI })
        });

        if (!verifyRes.ok) {
          const err = await verifyRes.json();
          throw new Error(err.error || 'Registration failed');
        }

        showSuccess('✅ Hardware key registered successfully!');
        if (emailInput) emailInput.value = '';
      } catch (err: any) {
        // Format error message - preserve line breaks for multi-line messages
        const errorMsg = err.message || 'Registration failed';
        showError(errorMsg.replace(/\n/g, '<br>'));
        console.error('Registration error:', err);
      } finally {
        globalWebAuthnOperationInProgress = false;
        setButtonsEnabled(true);
      }
    }

    async function signIn() {
      // CRITICAL: Prevent multiple simultaneous WebAuthn operations (module-level guard)
      // Check and set atomically to prevent race conditions
      if (globalWebAuthnOperationInProgress) {
        console.warn('⚠️ WebAuthn operation already in progress, ignoring duplicate request');
        return;
      }
      
      // Set flag IMMEDIATELY (synchronously) before any async operations
      globalWebAuthnOperationInProgress = true;

      const emailInput = document.getElementById('signinEmail') as HTMLInputElement;
      const email = emailInput?.value.trim();
      if (!email) {
        globalWebAuthnOperationInProgress = false; // Reset on early return
        showError('Please enter your email');
        return;
      }

      // Don't check service status here - let the user try and handle errors naturally
      setButtonsEnabled(false);
      try {
        const challengeRes = await fetch(`${API_BASE}/auth/webauthn/authenticate-challenge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });

        if (!challengeRes.ok) {
          const err = await challengeRes.json();
          
          // Check if service is unavailable
          if (challengeRes.status === 503 || err.error === 'Service unavailable') {
            const errorMsg = `❌ Admin-auth service is not running.\n\n` +
              `To start the service:\n` +
              `1. Open PowerShell/Terminal\n` +
              `2. Navigate to: cd admin-auth\n` +
              `3. Run: $env:LOCAL_DEV = "true"; node index.js\n` +
              `4. Keep that terminal open and refresh this page`;
            throw new Error(errorMsg);
          }
          
          throw new Error(err.error || err.message || 'Failed to get authentication challenge');
        }

        const { options } = await challengeRes.json();
        
        // Debug: Log received options
        console.log('Received authentication options:', options);
        
        // Validate and warn (but don't fail) if required fields are missing
        if (!options.rpId && !options.rp?.id) {
          console.warn('⚠️ Missing rpId in server response. This may cause WebAuthn to fail.');
        }
        if (!options.allowCredentials || !Array.isArray(options.allowCredentials)) {
          console.warn('⚠️ Missing or invalid allowCredentials in server response.');
        }
        
        // Convert base64url strings to ArrayBuffers
        if (options.challenge) {
          options.challenge = base64urlToBuffer(options.challenge);
        }
        if (options.allowCredentials && Array.isArray(options.allowCredentials)) {
          options.allowCredentials = options.allowCredentials.map((cred: any) => ({
            ...cred,
            id: base64urlToBuffer(cred.id)
          }));
        }
        
        // Ensure rpId is set correctly (WebAuthn API expects rpId, not rp.id)
        if (options.rp?.id && !options.rpId) {
          options.rpId = options.rp.id;
        }
        
        // Remove rp object if rpId is set (WebAuthn get() expects rpId, not rp)
        if (options.rpId && options.rp) {
          delete options.rp;
        }

        // Double-check guard right before WebAuthn API call (in case of race condition)
        if (globalWebAuthnOperationInProgress === false) {
          // Another operation completed, but we shouldn't be here
          console.warn('⚠️ WebAuthn guard was reset unexpectedly');
        }

        const assertion = await navigator.credentials.get({
          publicKey: options
        }) as PublicKeyCredential;

        const credentialForAPI = {
          id: bufferToBase64url(assertion.rawId),
          type: assertion.type,
          response: {
            authenticatorData: bufferToBase64url((assertion.response as any).authenticatorData),
            clientDataJSON: bufferToBase64url((assertion.response as any).clientDataJSON),
            signature: bufferToBase64url((assertion.response as any).signature),
            userHandle: (assertion.response as any).userHandle ? bufferToBase64url((assertion.response as any).userHandle) : null
          }
        };

        const verifyRes = await fetch(`${API_BASE}/auth/webauthn/authenticate-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, credential: credentialForAPI })
        });

        if (!verifyRes.ok) {
          const err = await verifyRes.json();
          throw new Error(err.error || 'Authentication failed');
        }

        const { sessionToken, expiresAt, ttl } = await verifyRes.json();
        
        // Store session token for admin dashboard access
        localStorage.setItem('admin_session_token', sessionToken);
        localStorage.setItem('admin_session_expires', expiresAt);
        
        showSuccess('✅ Signed in successfully! Redirecting...');
        
        // Redirect to admin dashboard or returnTo path
        // Use returnTo from URL params if available, otherwise default to /admin
        const urlParams = new URLSearchParams(window.location.search);
        const returnToPath = urlParams.get('returnTo');
        const redirectPath = returnToPath && returnToPath.startsWith('/admin') 
          ? returnToPath 
          : '/admin';
        
        // Use replace instead of push to avoid adding to history
        // Small delay to ensure localStorage is written
        setTimeout(() => {
          router.replace(redirectPath);
        }, 100);
      } catch (err: any) {
        // Format error message - preserve line breaks for multi-line messages
        const errorMsg = err.message || 'Sign-in failed';
        showError(errorMsg.replace(/\n/g, '<br>'));
        console.error('Sign-in error:', err);
      } finally {
        globalWebAuthnOperationInProgress = false;
        setButtonsEnabled(true);
      }
    }

    async function verifySession() {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        showError('No session token found. Please sign in first.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/verify`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
          throw new Error('Session invalid');
        }

        const data = await res.json();
        showSuccess(`Session valid. Email: ${data.email}`);
      } catch (err: any) {
        showError('Session verification failed: ' + err.message);
        localStorage.removeItem('admin_session_token');
      }
    }

    async function logout() {
      const token = localStorage.getItem('admin_session_token');
      if (!token) {
        showError('No session to logout');
        return;
      }

      try {
        await fetch(`${API_BASE}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });

        localStorage.removeItem('admin_session_token');
        localStorage.removeItem('admin_session_expires');
        const sessionInfo = document.getElementById('sessionInfo');
        const verifySection = document.getElementById('verifySection');
        if (sessionInfo) sessionInfo.style.display = 'none';
        if (verifySection) verifySection.style.display = 'none';
        showSuccess('Logged out successfully');
        
        // Redirect to super admin signin page after logout (not signup)
        setTimeout(() => {
          router.push('/admin/super-admin-signin');
        }, 1000);
      } catch (err: any) {
        showError('Logout failed: ' + err.message);
      }
    }

    function base64urlToBuffer(base64url: string) {
      const binary = atob(base64url.replace(/-/g, '+').replace(/_/g, '/'));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    }

    function bufferToBase64url(buffer: ArrayBuffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }

    function copySQL() {
      const emailInput = document.getElementById('sqlEmail') as HTMLInputElement;
      const nameInput = document.getElementById('sqlName') as HTMLInputElement;
      const email = emailInput?.value || 'admin@example.com';
      const name = nameInput?.value || 'Test Admin';
      
      if (!email || !email.includes('@')) {
        showError('Please enter a valid email address');
        return;
      }
      
      const sql = `INSERT INTO super_admins (
  email, full_name, status,
  created_by, activated_at, activated_by,
  ticket_reference, created_at, updated_at
) VALUES (
  '${email}',
  '${name}',
  'active',
  '550e8400-e29b-41d4-a716-446655440001', -- operator1: maheshwari@drishiq.com
  NOW(),
  '550e8400-e29b-41d4-a716-446655440002', -- operator2: mukund@drishiq.com
  'TEST-001',
  NOW(),
  NOW()
);`;
      
      const preview = document.getElementById('sqlPreview');
      if (preview) {
        preview.textContent = sql;
        preview.style.display = 'block';
      }
      
      navigator.clipboard.writeText(sql).then(() => {
        showSuccess('✅ SQL copied to clipboard! Paste it in Supabase SQL Editor.');
      }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = sql;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showSuccess('✅ SQL copied to clipboard!');
      });
    }

    function showCLIInstructions() {
      const emailInput = document.getElementById('createEmail') as HTMLInputElement;
      const nameInput = document.getElementById('createName') as HTMLInputElement;
      const email = emailInput?.value || 'admin@example.com';
      const name = nameInput?.value || 'Test Admin';
      const instructions = document.getElementById('cliInstructions');
      
      const commands = `# Step 1: Create pending super admin
node ../cli/create_super_admin.js create \\
  --email ${email} \\
  --full-name "${name}" \\
  --ticket TEST-001 \\
  --operator-id 550e8400-e29b-41d4-a716-446655440001 \\
  --operator-email maheshwari@drishiq.com

# Copy the action-id from output, then:

# Step 2: Approve (replace <action-id> with actual ID)
node ../cli/create_super_admin.js approve \\
  --action-id <action-id> \\
  --ticket TEST-001 \\
  --approver-id 550e8400-e29b-41d4-a716-446655440002 \\
  --approver-email mukund@drishiq.com`;
      
      if (instructions) {
        instructions.textContent = commands;
        instructions.style.display = 'block';
      }
      
      navigator.clipboard.writeText(commands).then(() => {
        showSuccess('✅ CLI commands copied! Run them in your terminal.');
      });
    }

    // Check if WebAuthn is supported
    if (!window.PublicKeyCredential) {
      showError('⚠️ WebAuthn is not supported in this browser. Please use Chrome, Firefox, Safari, or Edge.');
    }

    // CRITICAL: Attach event listeners AFTER all functions are defined
    // This ensures buttons work even if health check is skipped
    const attachEventListeners = () => {
      const registerBtn = document.getElementById('registerBtn') as HTMLButtonElement;
      const signinBtn = document.getElementById('signinBtn') as HTMLButtonElement;
      const verifyBtn = document.getElementById('verifyBtn') as HTMLButtonElement;
      const logoutBtn = document.getElementById('logoutBtn') as HTMLButtonElement;
      const copySQLBtn = document.getElementById('copySQLBtn');
      const showCLIBtn = document.getElementById('showCLIBtn');

      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.style.cursor = 'pointer';
        registerBtn.style.opacity = '1';
        // Remove old listener before adding new one to prevent duplicates
        registerBtn.removeEventListener('click', registerWebAuthn);
        registerBtn.addEventListener('click', registerWebAuthn);
        console.log('✅ Register button listener attached and enabled');
      } else {
        console.warn('❌ Register button not found');
      }
      if (signinBtn) {
        signinBtn.disabled = false;
        signinBtn.style.cursor = 'pointer';
        signinBtn.style.opacity = '1';
        signinBtn.removeEventListener('click', signIn);
        signinBtn.addEventListener('click', signIn);
        console.log('✅ Sign-in button listener attached and enabled');
      } else {
        console.warn('❌ Sign-in button not found');
      }
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.style.cursor = 'pointer';
        verifyBtn.style.opacity = '1';
        verifyBtn.removeEventListener('click', verifySession);
        verifyBtn.addEventListener('click', verifySession);
      }
      if (logoutBtn) {
        logoutBtn.disabled = false;
        logoutBtn.style.cursor = 'pointer';
        logoutBtn.style.opacity = '1';
        logoutBtn.removeEventListener('click', logout);
        logoutBtn.addEventListener('click', logout);
      }
      if (copySQLBtn) {
        copySQLBtn.removeEventListener('click', copySQL);
        copySQLBtn.addEventListener('click', copySQL);
        console.log('✅ Copy SQL button listener attached');
      }
      if (showCLIBtn) {
        showCLIBtn.removeEventListener('click', showCLIInstructions);
        showCLIBtn.addEventListener('click', showCLIInstructions);
        console.log('✅ Show CLI button listener attached');
      }
      
      // Ensure buttons are enabled (force enable)
      setButtonsEnabled(true);
      console.log('✅ All buttons enabled and ready');
    };

    // CRITICAL: Enable buttons immediately on page load, before health check
    // This ensures buttons are clickable even if health check takes time
    setButtonsEnabled(true);
    
    // Attach listeners immediately, then retry after delays to catch any late-rendered buttons
    attachEventListeners();
    setTimeout(attachEventListeners, 100);
    setTimeout(attachEventListeners, 500);
    setTimeout(attachEventListeners, 1000);
    setTimeout(attachEventListeners, 2000); // Extra retry for slow renders

    // Cleanup
    return () => {
      // Remove event listeners
      const registerBtn = document.getElementById('registerBtn');
      const signinBtn = document.getElementById('signinBtn');
      const verifyBtn = document.getElementById('verifyBtn');
      const logoutBtn = document.getElementById('logoutBtn');
      const copySQLBtn = document.getElementById('copySQLBtn');
      const showCLIBtn = document.getElementById('showCLIBtn');
      
      if (registerBtn) registerBtn.removeEventListener('click', registerWebAuthn);
      if (signinBtn) signinBtn.removeEventListener('click', signIn);
      if (verifyBtn) verifyBtn.removeEventListener('click', verifySession);
      if (logoutBtn) logoutBtn.removeEventListener('click', logout);
      if (copySQLBtn) copySQLBtn.removeEventListener('click', copySQL);
      if (showCLIBtn) showCLIBtn.removeEventListener('click', showCLIInstructions);
    };
    // CRITICAL: Empty dependency array - only run once on mount
    // Don't depend on router or any other values that might change
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

