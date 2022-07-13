<template>
    <div class="carousel-3d-controls">
        <button
            class="prev"
            @click.prevent="goPrev()"
            aria-label="Previous slide"
        >
            <slot name="control-prev" />
        </button>
        <button
            class="next"
            @click.prevent="goNext()"
            :class="{ disabled: !isNextPossible?.valueOf }"
            aria-label="Next slide"
        >
            <slot name="control-next" />
        </button>
    </div>
</template>

<script lang="ts">
import { defineComponent, inject } from "vue";
import type { ComputedRef } from "vue";

export default defineComponent({
    name: "controls",
    props: {
        /**
         * Width in pixels of the navigation buttons
         */
        width: {
            type: [String, Number],
            default: 50,
        },
        /**
         * Height in pixels of the navigation buttons
         */
        height: {
            type: [String, Number],
            default: 60,
        },
        /**
         * Text content of the navigation prev button
         */
    },
    setup() {
        const isPrevPossible = inject<ComputedRef<boolean>>("isPrevPossible");
        const isNextPossible = inject<ComputedRef<boolean>>("isNextPossible");
        const goNext = inject<Function>("goNext", () => {});
        const goPrev = inject<Function>("goPrev", () => {});

        return {
            isPrevPossible,
            isNextPossible,
            goNext,
            goPrev,
        };
    },
});
</script>

<style scoped>
.carousel-3d-controls {
    position: absolute;
    top: 50%;
    height: 0;
    margin-top: -30px;
    left: 0;
    width: 100%;
    z-index: 1000;
}

button {
    background-color: transparent;
    border: none;
    padding: 0;
}

.next,
.prev {
    position: absolute;
    z-index: 1010;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    text-decoration: none;
    top: 0;
}

.prev {
    left: 10px;
    text-align: left;
}

.next {
    right: 10px;
    text-align: right;
}

.disabled {
    opacity: 0.2;
    cursor: default;
}

.disabled:hover {
    cursor: default;
    opacity: 0.2;
}
</style>
