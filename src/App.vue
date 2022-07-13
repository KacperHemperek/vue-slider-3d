<script setup lang="ts">
import Carousel3dVue from "./components/Carousel3d.vue";

const slides = ["1", "2", "3", "4", "5"];
</script>

<template>
    <div class="container">
        <Carousel3dVue
            :slides="slides"
            :width="400"
            :height="600"
            :controls-visible="true"
            :perspective="35"
        >
            <template #slide>
                <div class="slide">
                    <img
                        class="object-cover"
                        src="./assets/Fight-Club-movie-poster-1999.png"
                        alt="movie"
                    />
                </div>
            </template>
            <template #control-prev>
                <div class="control-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 320 512"
                        class="control"
                    >
                        <path
                            d="M224 480c-8.188 0-16.38-3.125-22.62-9.375l-192-192c-12.5-12.5-12.5-32.75 0-45.25l192-192c12.5-12.5 32.75-12.5 45.25 0s12.5 32.75 0 45.25L77.25 256l169.4 169.4c12.5 12.5 12.5 32.75 0 45.25C240.4 476.9 232.2 480 224 480z"
                        />
                    </svg>
                </div>
            </template>
            <template #control-next>
                <div class="control-wrapper">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 320 512"
                        class="control"
                    >
                        <path
                            d="M96 480c-8.188 0-16.38-3.125-22.62-9.375c-12.5-12.5-12.5-32.75 0-45.25L242.8 256L73.38 86.63c-12.5-12.5-12.5-32.75 0-45.25s32.75-12.5 45.25 0l192 192c12.5 12.5 12.5 32.75 0 45.25l-192 192C112.4 476.9 104.2 480 96 480z"
                        />
                    </svg>
                </div>
            </template>
        </Carousel3dVue>
    </div>
</template>

<style>
@import "./assets/base.css";

.container {
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
}
.control {
    width: 1.5rem;
    height: 1.5rem;
}
.control-wrapper {
    background-color: transparent;
    cursor: pointer;
    padding: 0.5rem;
    border-radius: 100%;
    aspect-ratio: 1/1;
    display: flex;
    fill: rgba(0, 0, 0, 0.4);
    transition: all 200ms;
}
.control-wrapper:hover {
    background-color: rgba(255, 255, 255, 0.5);
    fill: rgba(0, 0, 0, 1);
}
</style>
