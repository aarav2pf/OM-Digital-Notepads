import {
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	createContext,
} from 'react';

import { supabase } from '../lib/supabase';
import { requestAuthorization } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [session, setSession] = useState(null);
	const [user, setUser] = useState(null);

	// null = authorization is still being checked
	// true = authorized
	// false = not authorized
	const [authorized, setAuthorized] = useState(null);

	// Only used for the initial application startup.
	const [loading, setLoading] = useState(true);

	// Refs prevent Supabase auth events from using stale state.
	const sessionRef = useRef(null);
	const authorizedRef = useRef(null);
	const mountedRef = useRef(true);

	const updateSession = useCallback((currentSession) => {
		sessionRef.current = currentSession;

		setSession(currentSession);
		setUser(currentSession?.user || null);
	}, []);

	const updateAuthorized = useCallback((value) => {
		authorizedRef.current = value;
		setAuthorized(value);
	}, []);

	const checkAuthorization = useCallback(
		async (currentSession) => {
			if (!currentSession?.access_token) {
				updateAuthorized(false);
				return false;
			}

			try {
				await requestAuthorization(
					currentSession.access_token
				);

				if (!mountedRef.current) {
					return false;
				}

				updateAuthorized(true);
				return true;
			} catch (error) {
				console.error(
					'Authorization check failed:',
					error
				);

				if (mountedRef.current) {
					updateAuthorized(false);
				}

				return false;
			}
		},
		[updateAuthorized]
	);

	useEffect(() => {
		mountedRef.current = true;

		async function initialize() {
			try {
				const {
					data: { session: currentSession },
				} = await supabase.auth.getSession();

				if (!mountedRef.current) {
					return;
				}

				updateSession(currentSession);

				if (!currentSession) {
					updateAuthorized(false);
					setLoading(false);
					return;
				}

				// Initial authorization check.
				await checkAuthorization(currentSession);

				if (mountedRef.current) {
					setLoading(false);
				}
			} catch (error) {
				console.error(
					'Authentication initialization failed:',
					error
				);

				if (mountedRef.current) {
					updateSession(null);
					updateAuthorized(false);
					setLoading(false);
				}
			}
		}

		initialize();

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange(
			async (event, currentSession) => {
				if (!mountedRef.current) {
					return;
				}

				/*
				 * SIGNED_OUT
				 *
				 * This is a real logout.
				 * We can safely remove the application.
				 */
				if (event === 'SIGNED_OUT') {
					updateSession(null);
					updateAuthorized(false);
					setLoading(false);
					return;
				}

				/*
				 * TOKEN_REFRESHED
				 *
				 * This happens while the user is still logged in.
				 * DO NOT show a loading screen.
				 * DO NOT check authorization again.
				 * DO NOT unmount NotepadApp.
				 */
				if (event === 'TOKEN_REFRESHED') {
					updateSession(currentSession);
					return;
				}

				/*
				 * USER_UPDATED
				 *
				 * Keep the current application alive.
				 */
				if (event === 'USER_UPDATED') {
					updateSession(currentSession);
					return;
				}

				/*
				 * INITIAL_SESSION
				 *
				 * initialize() already handles the initial session.
				 */
				if (event === 'INITIAL_SESSION') {
					return;
				}

				/*
				 * SIGNED_IN
				 *
				 * Supabase can emit SIGNED_IN again when an existing
				 * session is detected, including when returning to
				 * a browser tab.
				 *
				 * If this is the SAME user who is already authorized,
				 * do absolutely nothing that would unmount the app.
				 */
				if (event === 'SIGNED_IN') {
					const previousUserId =
						sessionRef.current?.user?.id;

					const currentUserId =
						currentSession?.user?.id;

					const sameAuthorizedUser =
						previousUserId &&
						currentUserId &&
						previousUserId === currentUserId &&
						authorizedRef.current === true;

					if (sameAuthorizedUser) {
						// Just keep the current session reference fresh.
						updateSession(currentSession);
						return;
					}

					/*
					 * This is a genuinely new login/session.
					 * Authorization needs to be checked.
					 */
					updateSession(currentSession);
					updateAuthorized(null);

					await checkAuthorization(currentSession);

					return;
				}
			}
		);

		return () => {
			mountedRef.current = false;
			subscription.unsubscribe();
		};
	}, [
		checkAuthorization,
		updateAuthorized,
		updateSession,
	]);

	async function logout() {
		await supabase.auth.signOut();

		updateSession(null);
		updateAuthorized(false);
	}

	return (
		<AuthContext.Provider
			value={{
				session,
				user,
				authorized,
				loading,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}