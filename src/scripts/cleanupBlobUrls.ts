import { supabase } from '../integrations/supabase/client';

async function cleanupBlobUrls() {
  console.log('🧹 Début du nettoyage des URL blob...');

  try {
    // 1. Nettoyer admin_settings
    console.log('📋 Nettoyage admin_settings...');
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
          console.log(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.hero_background_image);
          newValue.hero_background_image = null;
          updated = true;
        }

        // Vérifier logo_url
        if (newValue.logo_url && newValue.logo_url.startsWith('blob:')) {
          console.log(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.logo_url);
          newValue.logo_url = null;
          updated = true;
        }

        // Vérifier favicon_url
        if (newValue.favicon_url && newValue.favicon_url.startsWith('blob:')) {
          console.log(`❌ URL blob trouvée dans admin_settings (${setting.key}):`, newValue.favicon_url);
          newValue.favicon_url = null;
          updated = true;
        }

        if (updated) {
          const { error: updateError } = await supabase
            .from('admin_settings')
            .update({ value: newValue })
            .eq('key', setting.key);
          
          if (updateError) {
            console.error('❌ Erreur lors de la mise à jour admin_settings:', updateError);
          } else {
            console.log(`✅ admin_settings (${setting.key}) nettoyé`);
          }
        }
      }
    }

    // 2. Nettoyer profiles
    console.log('👤 Nettoyage profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .like('avatar_url', 'blob:%');

    if (profilesError) throw profilesError;

    for (const profile of profiles || []) {
      console.log(`❌ URL blob trouvée dans profiles (${profile.id}):`, profile.avatar_url);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour profiles:', updateError);
      } else {
        console.log(`✅ Profile (${profile.id}) nettoyé`);
      }
    }

    // 3. Nettoyer spaces
    console.log('🏢 Nettoyage spaces...');
    const { data: spaces, error: spacesError } = await supabase
      .from('spaces')
      .select('id, image_url')
      .like('image_url', 'blob:%');

    if (spacesError) throw spacesError;

    for (const space of spaces || []) {
      console.log(`❌ URL blob trouvée dans spaces (${space.id}):`, space.image_url);
      const { error: updateError } = await supabase
        .from('spaces')
        .update({ image_url: null })
        .eq('id', space.id);
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour spaces:', updateError);
      } else {
        console.log(`✅ Space (${space.id}) nettoyé`);
      }
    }

    // 4. Nettoyer documents
    console.log('📄 Nettoyage documents...');
    const { data: documents, error: documentsError } = await supabase
      .from('documents')
      .select('id, file_url')
      .like('file_url', 'blob:%');

    if (documentsError) throw documentsError;

    for (const document of documents || []) {
      console.log(`❌ URL blob trouvée dans documents (${document.id}):`, document.file_url);
      const { error: updateError } = await supabase
        .from('documents')
        .update({ file_url: null })
        .eq('id', document.id);
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour documents:', updateError);
      } else {
        console.log(`✅ Document (${document.id}) nettoyé`);
      }
    }

    // 5. Nettoyer carousel_images
    console.log('🖼️ Nettoyage carousel_images...');
    const { data: carouselImages, error: carouselError } = await supabase
      .from('carousel_images')
      .select('id, image_url')
      .like('image_url', 'blob:%');

    if (carouselError) throw carouselError;

    for (const image of carouselImages || []) {
      console.log(`❌ URL blob trouvée dans carousel_images (${image.id}):`, image.image_url);
      const { error: updateError } = await supabase
        .from('carousel_images')
        .update({ image_url: null })
        .eq('id', image.id);
      
      if (updateError) {
        console.error('❌ Erreur lors de la mise à jour carousel_images:', updateError);
      } else {
        console.log(`✅ Carousel image (${image.id}) nettoyé`);
      }
    }

    console.log('✅ Nettoyage terminé !');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le script
cleanupBlobUrls(); 