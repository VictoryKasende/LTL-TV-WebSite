// Banner admin: show the YouTube link for a video banner, the image
// variants for an image banner — never both.
document.addEventListener('DOMContentLoaded', () => {
  const radios = document.querySelectorAll('input[name="kind"]');
  if (!radios.length) return;

  const youtubeInput = document.getElementById('id_youtube_url');
  const youtubeSection = youtubeInput && youtubeInput.closest('fieldset');
  const imagesSection = document.getElementById('images-group');

  function sync() {
    const checked = document.querySelector('input[name="kind"]:checked');
    const isVideo = checked && checked.value === 'video';
    if (youtubeSection) youtubeSection.hidden = !isVideo;
    if (imagesSection) imagesSection.hidden = isVideo;
  }

  radios.forEach((radio) => radio.addEventListener('change', sync));
  sync();
});
