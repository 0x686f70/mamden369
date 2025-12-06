// Avatar selection for new game form
function selectPlayerAvatar(button, index) {
    currentAvatarButtonIndex = index;
    const currentAvatar = playerAvatars[index] || avatarImages[index % avatarImages.length];

    // Show modal with avatar grid
    const modal = document.getElementById('avatar-selector-modal');
    modal.classList.remove('hidden');

    // Render grid
    const container = document.getElementById('avatar-selector-grid');
    container.innerHTML = '';
    avatarImages.forEach(avatar => {
        const btn = document.createElement('button');
        btn.className = 'avatar-option';
        btn.textContent = avatar;
        btn.type = 'button';

        if (avatar === currentAvatar) {
            btn.classList.add('selected');
        }

        btn.onclick = () => {
            // Update avatar
            playerAvatars[currentAvatarButtonIndex] = avatar;
            // Update button preview
            button.querySelector('.avatar-preview').textContent = avatar;
            // Update selection visual
            container.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };

        container.appendChild(btn);
    });

    refreshIcons();
}

function closeAvatarSelector() {
    document.getElementById('avatar-selector-modal').classList.add('hidden');
}
