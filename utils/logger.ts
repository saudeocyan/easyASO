import { supabase } from '../supabaseClient';

export const logAction = async (action: string, target: string, details?: string) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.warn('No authenticated user found for logging');
            return;
        }

        const { error } = await supabase
            .from('audit_logs')
            .insert([
                {
                    action,
                    target,
                    details,
                    actor_id: user.id
                }
            ]);

        if (error) {
            console.error('Error logging action:', error);
        }
    } catch (error) {
        console.error('Unexpected error logging action:', error);
    }
};
