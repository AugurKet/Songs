// script.js - GitHub MP3 Player Logic

class GitHubMusicPlayer {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playlist = document.getElementById('playlist');
        this.currentSongIndex = 0;
        this.songs = [];
        this.isPlaying = false;
        this.isShuffled = false;
        this.repeatMode = 'none'; // 'none', 'all', 'one'
        this.shuffledIndices = [];
        
        // GitHub configuration - UPDATE THESE VALUES!
        this.githubUsername = 'augurket'; // Replace with your GitHub username
        this.githubRepo = 'Songs'; // Replace with your repository name
        this.githubBranch = 'main'; // or 'master'
        this.musicFolder = 'mp3-player/music'; // folder where MP3s are stored
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.loadSongsFromGitHub();
        this.setupAudioEvents();
    }
    
    setupEventListeners() {
        // Play/Pause button
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlay());
        
        // Previous/Next buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.playPrevious());
        document.getElementById('nextBtn').addEventListener('click', () => this.playNext());
        
        // Shuffle and Repeat
        document.getElementById('shuffleBtn').addEventListener('click', () => this.toggleShuffle());
        document.getElementById('repeatBtn').addEventListener('click', () => this.toggleRepeat());
        
        // Progress bar
        document.getElementById('progressBar').addEventListener('input', (e) => {
            const seekTime = (e.target.value / 100) * this.audioPlayer.duration;
            this.audioPlayer.currentTime = seekTime;
        });
        
        // Volume control
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.audioPlayer.volume = e.target.value / 100;
        });
        
        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => this.loadSongsFromGitHub());
        
        // Audio ended event
        this.audioPlayer.addEventListener('ended', () => this.handleSongEnd());
    }
    
    setupAudioEvents() {
        // Update progress bar
        this.audioPlayer.addEventListener('timeupdate', () => {
            const progress = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            document.getElementById('progressBar').value = progress || 0;
            
            // Update time displays
            document.getElementById('currentTime').textContent = this.formatTime(this.audioPlayer.currentTime);
            document.getElementById('duration').textContent = this.formatTime(this.audioPlayer.duration);
        });
        
        // Update play button when song starts/pauses
        this.audioPlayer.addEventListener('play', () => {
            this.isPlaying = true;
            document.getElementById('playPauseIcon').className = 'fa-solid fa-pause text-2xl';
        });
        
        this.audioPlayer.addEventListener('pause', () => {
            this.isPlaying = false;
            document.getElementById('playPauseIcon').className = 'fa-solid fa-play text-2xl';
        });
    }
    
    async loadSongsFromGitHub() {
        try {
            // Show loading state
            this.playlist.innerHTML = '<div class="text-center text-gray-400 py-4"><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Loading songs...</div>';
            
            // Fetch MP3 files from GitHub repository
            const apiUrl = `https://api.github.com/repos/${this.githubUsername}/${this.githubRepo}/contents/${this.musicFolder}?ref=${this.githubBranch}`;
            
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const files = await response.json();
            
            // Filter for MP3 files
            this.songs = files.filter(file => 
                file.name.toLowerCase().endsWith('.mp3')
            ).map(file => ({
                name: file.name.replace('.mp3', ''),
                url: file.download_url,
                path: file.path
            }));
            
            if (this.songs.length === 0) {
                this.playlist.innerHTML = '<div class="text-center text-gray-400 py-4">No MP3 files found in the music folder</div>';
                return;
            }
            
            // Display playlist
            this.displayPlaylist();
            
            // Initialize shuffled indices
            this.updateShuffledIndices();
            
        } catch (error) {
            console.error('Error loading songs:', error);
            this.playlist.innerHTML = `<div class="text-center text-red-400 py-4">
                <i class="fa-solid fa-exclamation-circle mr-2"></i>
                Error loading songs. Please check your GitHub configuration.
            </div>`;
        }
    }
    
    displayPlaylist() {
        this.playlist.innerHTML = '';
        
        this.songs.forEach((song, index) => {
            const songElement = document.createElement('div');
            songElement.className = `playlist-item p-2 rounded cursor-pointer transition ${
                index === this.currentSongIndex 
                    ? 'bg-purple-600 text-white' 
                    : 'hover:bg-white/10 text-gray-300'
            }`;
            songElement.innerHTML = `
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                        <i class="fa-solid fa-music text-sm"></i>
                        <span>${song.name}</span>
                    </div>
                    ${index === this.currentSongIndex && this.isPlaying ? 
                        '<i class="fa-solid fa-volume-high text-xs"></i>' : ''}
                </div>
            `;
            
            songElement.addEventListener('click', () => this.playSong(index));
            
            this.playlist.appendChild(songElement);
        });
    }
    
    playSong(index) {
        if (index < 0 || index >= this.songs.length) return;
        
        this.currentSongIndex = index;
        const song = this.songs[index];
        
        // Update audio source and play
        this.audioPlayer.src = song.url;
        this.audioPlayer.play();
        
        // Update UI
        document.getElementById('currentSong').textContent = song.name;
        document.getElementById('songArtist').textContent = 'Loading from GitHub...';
        
        // Highlight current song in playlist
        this.displayPlaylist();
    }
    
    togglePlay() {
        if (this.songs.length === 0) return;
        
        if (this.audioPlayer.paused) {
            if (!this.audioPlayer.src) {
                this.playSong(0);
            } else {
                this.audioPlayer.play();
            }
        } else {
            this.audioPlayer.pause();
        }
    }
    
    playNext() {
        if (this.songs.length === 0) return;
        
        let nextIndex;
        
        if (this.isShuffled) {
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentSongIndex);
            nextIndex = this.shuffledIndices[(currentShuffleIndex + 1) % this.songs.length];
        } else {
            nextIndex = (this.currentSongIndex + 1) % this.songs.length;
        }
        
        this.playSong(nextIndex);
    }
    
    playPrevious() {
        if (this.songs.length === 0) return;
        
        let prevIndex;
        
        if (this.isShuffled) {
            const currentShuffleIndex = this.shuffledIndices.indexOf(this.currentSongIndex);
            prevIndex = this.shuffledIndices[(currentShuffleIndex - 1 + this.songs.length) % this.songs.length];
        } else {
            prevIndex = (this.currentSongIndex - 1 + this.songs.length) % this.songs.length;
        }
        
        this.playSong(prevIndex);
    }
    
    handleSongEnd() {
        if (this.repeatMode === 'one') {
            // Repeat current song
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play();
        } else if (this.repeatMode === 'all' || this.isShuffled) {
            // Play next song
            this.playNext();
        } else if (this.currentSongIndex < this.songs.length - 1) {
            // Play next if not last
            this.playNext();
        }
    }
    
    toggleShuffle() {
        this.isShuffled = !this.isShuffled;
        const shuffleBtn = document.getElementById('shuffleBtn');
        
        if (this.isShuffled) {
            shuffleBtn.classList.add('text-purple-400');
            shuffleBtn.classList.remove('text-gray-400');
            this.updateShuffledIndices();
        } else {
            shuffleBtn.classList.remove('text-purple-400');
            shuffleBtn.classList.add('text-gray-400');
        }
    }
    
    toggleRepeat() {
        const modes = ['none', 'all', 'one'];
        const currentIndex = modes.indexOf(this.repeatMode);
        this.repeatMode = modes[(currentIndex + 1) % modes.length];
        
        const repeatBtn = document.getElementById('repeatBtn');
        
        switch(this.repeatMode) {
            case 'none':
                repeatBtn.classList.remove('text-purple-400');
                repeatBtn.classList.add('text-gray-400');
                break;
            case 'all':
                repeatBtn.classList.add('text-purple-400');
                repeatBtn.classList.remove('text-green-400');
                break;
            case 'one':
                repeatBtn.classList.add('text-green-400');
                repeatBtn.classList.remove('text-purple-400');
                break;
        }
    }
    
    updateShuffledIndices() {
        // Create array of indices and shuffle them
        this.shuffledIndices = Array.from({length: this.songs.length}, (_, i) => i);
        for (let i = this.shuffledIndices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.shuffledIndices[i], this.shuffledIndices[j]] = [this.shuffledIndices[j], this.shuffledIndices[i]];
        }
    }
    
    formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
}

// Initialize the player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GitHubMusicPlayer();
});
