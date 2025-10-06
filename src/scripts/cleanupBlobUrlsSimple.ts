import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

// Configuration Supabase (à adapter selon ton environnement)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupBlobUrls() {
  logger.debug('🧹 Début du nettoyage des URL blob...');

  try {
    // 1. Nettoyer admin_settings
    logger.debug('📋 Nettoyage admin_settings...');
    const { data: adminSettings, error: adminError } = await supabase
      .from('admin_settings')
      .select('*');
    
    if (adminError) throw adminError;

    for (const setting of adminSettings || []) {
      if (setting.value && typeof setting.value === 'object') {
        let updated = false;
        const newValue = { ...setting.value };

        // Vérifier hero_background_image
        if (newValue.hero_background_image && newValue.hero_background_image.startsWith('blob:')) {
          logger.debug(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.hero_background_image);
          newValue.hero_background_image = null;
          updated = true;
        }

        // Vérifier logo_url
        if (newValue.logo_url && newValue.logo_url.startsWith('blob:')) {
          logger.debug(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.logo_url);
          newValue.logo_url = null;
          updated = true;
        }

        // Vérifier favicon_url
        if (newValue.favicon_url && newValue.favicon_url.startsWith('blob:')) {
          logger.debug(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.favicon_url);
          newValue.favicon_url = null;
          updated = true;
        }

        if (updated) {
          const { error: updateError } = await supabase
            .from('admin_settings')
            .update({ value: newValue })
            .eq('key', setting.key);
          
          if (updateError) {
            logger.error('❌ Erreur lors de la mise à jour admin_settings:', updateError);
          } else {
            logger.debug(`✅ admin_settings (${setting.key}) nettoyé`);
          }
        }
      }
    }

    // 2. Nettoyer profiles
    logger.debug('👤 Nettoyage profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .like('avatar_url', 'blob:%');

    if (profilesError) throw profilesError;

    for (const profile of profiles || []) {
      logger.debug(`❌ URL blob trouvée dans profiles (${profile.id}):`, profile.avatar_url);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);
      
      if (updateError) {
        logger.error('❌ Erreur lors de la mise à jour profiles:', updateError);
      } else {
        logger.debug(`✅ Profile (${profile.id}) nettoyé`);
      }
    }

    // 3. Nettoyer spaces
    logger.debug('🏢 Nettoyage spaces...');
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, image_url')
      .like('image_url', 'blob:%');

    if (spacesError) throw spacesError;

    for (const space of spaces || []) {
      logger.debug(`❌ URL blob trouvée dans spaces (${space.id}):`, space.image_url);
      const { error: updateError } = await supabase
        .from('spaces')
        .update({ image_url: null })
        .eq('id', space.id);
      
      if (updateError) {
        logger.error('❌ Erreur lors de la mise à jour spaces:', updateError);
      } else {
        logger.debug(`✅ Space (${space.id}) nettoyé`);
      }
    }

    // 4. Nettoyer documents
    logger.debug('📄 Nettoyage documents...');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, file_url')
      .like('file_url', 'blob:%');

    if (documentsError) throw documentsError;

    for (const document of documents || []) {
      logger.debug(`❌ URL blob trouvée dans documents (${document.id}):`, document.file_url);
      const { error: updateError } = await supabase
        .from('documents')
        .update({ file_url: null })
        .eq('id', document.id);
      
      if (updateError) {
        logger.error('❌ Erreur lors de la mise à jour documents:', updateError);
      } else {
        logger.debug(`✅ Document (${document.id}) nettoyé`);
      }
    }

    // 5. Nettoyer carousel_images
    logger.debug('🖼️ Nettoyage carousel_images...');
    const { data: carouselImages, error: carouselError } = await supabase
      .from('carousel_images')
      .select('id, image_url')
      .like('image_url', 'blob:%');

    if (carouselError) throw carouselError;

    for (const image of carouselImages || []) {
      logger.debug(`❌ URL blob trouvée dans carousel_images (${image.id}):`, image.image_url);
      const { error: updateError } = await supabase
        .from('carousel_images')
        .update({ image_url: null })
        .eq('id', image.id);
      
      if (updateError) {
        logger.error('❌ Erreur lors de la mise à jour carousel_images:', updateError);
      } else {
        logger.debug(`✅ Carousel image (${image.id}) nettoyé`);
      }
    }

    logger.debug('✅ Nettoyage terminé !');

  } catch (error) {
    logger.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le script
cleanupBlobUrls(); 