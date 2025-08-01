import { useState, useEffect } from 'react';

/*
const fallbackUser = {
  id: '3531584000057713001',
  name: 'Themba Zungu',
  email: 'zungu.t@itrtech.africa',
  profile: { name: 'Retentions' },
  role: { name: 'Sales' },
  isFallback: true
};
*/

const fallbackUser = {
  id: '3531584000057713001',
  name: 'Pieter Nortje',
  email: 'pieter@itrtech.africa',
  profile: { name: 'Sales Members' },
  role: { name: "RAM's" },
  isFallback: true
};

export const useCurrentUser = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoading, setUserLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const getCurrentUser = async () => {
      console.log('🔄 Starting getCurrentUser function...');
      setUserLoading(true);
      setAccessDenied(false);

      // Check if in development mode using import.meta.env.MODE
      if (import.meta.env.MODE === 'development') {
        console.log('💡 Development mode: Using fallback user.');
        setCurrentUser(fallbackUser);
        setUserLoading(false);
        return;
      }

      // Production mode logic
      // No fallback timeout in production if SDK isn't available,
      // as we explicitly want to show Access Denied.
      // The timeout is only for the getCurrentUser call itself.
      const zohoSdkLoadTimeout = setTimeout(() => {
        console.error('❌ Zoho SDK or Embedded App init timed out. Denying access.');
        setAccessDenied(true);
        setUserLoading(false);
      }, 5000); // Increased timeout for overall Zoho SDK loading and init

      try {
        // Check if ZOHO global object exists
        if (typeof ZOHO === 'undefined') {
          console.error('❌ ZOHO SDK not loaded. Denying access in production.');
          clearTimeout(zohoSdkLoadTimeout);
          setAccessDenied(true);
          setUserLoading(false);
          return;
        }

        console.log('✅ ZOHO SDK detected');

        // Check for Zoho CRM config availability
        if (!ZOHO.CRM || !ZOHO.CRM.CONFIG) {
          console.error('❌ ZOHO.CRM.CONFIG not available. Denying access in production.');
          clearTimeout(zohoSdkLoadTimeout);
          setAccessDenied(true);
          setUserLoading(false);
          return;
        }

        console.log('✅ ZOHO.CRM.CONFIG available');

        // Initialize Zoho embedded app if available
        if (ZOHO.embeddedApp && ZOHO.embeddedApp.init) {
          console.log('🔄 Initializing ZOHO embedded app...');
          try {
            await Promise.race([
              ZOHO.embeddedApp.init(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('ZOHO.embeddedApp.init timeout')), 3000)) // Timeout for init
            ]);
            console.log('✅ ZOHO embedded app initialized');
          } catch (initError) {
            console.error('❌ ZOHO embedded app init failed:', initError);
            clearTimeout(zohoSdkLoadTimeout);
            setAccessDenied(true);
            setUserLoading(false);
            return;
          }
        }

        console.log('🔄 Calling ZOHO.CRM.CONFIG.getCurrentUser()...');

        const userResponse = await Promise.race([
          ZOHO.CRM.CONFIG.getCurrentUser(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('getCurrentUser timeout')), 3500) // Timeout for getCurrentUser
          )
        ]);

        console.log('✅ getCurrentUser response:', userResponse);

        if (userResponse && userResponse.users && userResponse.users.length > 0) {
          const userData = userResponse.users[0];
          console.log('📊 User data:', userData);

          const currentUserData = {
            id: userData.id,
            name: userData.full_name || userData.name || `${userData.first_name || ''} ${userData.last_name || ''}`.trim(),
            email: userData.email,
            profile: userData.profile,
            role: userData.role,
            isFallback: false
          };

          console.log('✅ Processed current user:', currentUserData);
          clearTimeout(zohoSdkLoadTimeout); // Clear the main timeout on success
          setCurrentUser(currentUserData);
          setUserLoading(false);

        } else {
          console.error('❌ No user data in response:', userResponse);
          throw new Error('No user data returned from Zoho');
        }

      } catch (error) {
        console.error('❌ Error in getCurrentUser or Zoho SDK check:', error);
        clearTimeout(zohoSdkLoadTimeout); // Clear the main timeout on error
        setAccessDenied(true);
        setUserLoading(false);
      }

      console.log('✅ getCurrentUser function completed');
    };

    getCurrentUser();
  }, []);

  return { currentUser, userLoading, accessDenied };
};