<template>
    <div
        ref="el"
        class="carousel-3d-container"
        :style="{ height: slideHeight + 'px' }"
    >
        <div
            class="carousel-3d-slider"
            :style="{
                width: slideWidth + 'px',
                height: slideHeight + 'px',
            }"
        >
            <SlideVue v-for="(slide, i) in slides" :index="i" :key="i">
                <slot name="slide" />
            </SlideVue>
        </div>
        <ControlsVue
            v-if="controlsVisible"
            :width="controlsWidth"
            :height="controlsHeight"
        >
            <template #control-prev>
                <slot name="control-prev" />
            </template>
            <template #control-next>
                <slot name="control-next" />
            </template>
        </ControlsVue>
    </div>
</template>

<script lang="ts">
import {
    computed,
    defineComponent,
    defineEmits,
    nextTick,
    provide,
    ref,
    watch,
} from "vue";
import type { ComputedRef, Ref } from "vue";
import autoplay from "../lib/autoplay";
import ControlsVue from "./Controls.vue";
import SlideVue from "./Slide.vue";
import { typeCheckingParseInt } from "@/lib/helpers";

const noop = () => {};

export default defineComponent({
    name: "carousel3d",
    components: {
        ControlsVue,
        SlideVue,
    },
    props: {
        slides: {
            type: Array,
            default: [],
        },
        count: {
            type: [Number, String],
            default: 0,
        },
        perspective: {
            type: [Number, String],
            default: 35,
        },
        display: {
            type: [Number, String],
            default: 5,
        },
        loop: {
            type: Boolean,
            default: true,
        },
        animationSpeed: {
            type: [Number, String],
            default: 500,
        },
        dir: {
            type: String,
            default: "rtl",
        },
        width: {
            type: [Number, String],
            default: 360,
        },
        height: {
            type: [Number, String],
            default: 270,
        },
        border: {
            type: [Number, String],
            default: 0,
        },
        space: {
            type: [Number, String],
            default: "auto",
        },
        startIndex: {
            type: [Number, String],
            default: 0,
        },
        clickable: {
            type: Boolean,
            default: true,
        },
        disable3d: {
            type: Boolean,
            default: false,
        },
        minSwipeDistance: {
            type: Number,
            default: 10,
        },
        inverseScaling: {
            type: [Number, String],
            default: 300,
        },
        controlsVisible: {
            type: Boolean,
            default: false,
        },
        controlsPrevHtml: {
            type: String,
            default: "&lsaquo;",
        },
        controlsNextHtml: {
            type: String,
            default: "&rsaquo;",
        },
        controlsWidth: {
            type: [String, Number],
            default: 50,
        },
        controlsHeight: {
            type: [String, Number],
            default: 50,
        },
        onLastSlide: {
            type: Function,
            default: noop,
        },
        onSlideChange: {
            type: Function,
            default: noop,
        },
        bias: {
            type: String,
            default: "left",
        },
        onMainSlideClick: {
            type: Function,
            default: () => noop,
        },
        oneDirectional: {
            type: Boolean,
            default: () => false,
        },
        transparent: {
            type: Boolean,
            default: false,
        },
    },
    setup(props, ctx) {
        const el = ref<HTMLElement>();
        const viewport = ref<number>(0);
        const currentIndex = ref<number>(0);
        const total = ref<number>(0);
        const dragOffsetX = ref<number>(0);
        const dragStartX = ref<number>(0);
        const dragOffsetY = ref<number>(0);
        const dragStartY = ref<number>(0);
        const mousedown = ref<boolean>(false);
        const zIndex = ref<number>(998);
        const mutationObserver = ref();

        const isLastSlide = computed<boolean>(() => {
            return currentIndex.value === total.value - 1;
        });

        const isFirstSlide = computed<boolean>(() => {
            return currentIndex.value === 0;
        });

        const isNextPossible = computed<boolean>(() => {
            return !(!props.loop && isLastSlide.value);
        });

        const isPrevPossible = computed<boolean>(() => {
            return !(!props.loop && isFirstSlide.value);
        });

        const slideWidth = computed<number>(() => {
            return (
                typeCheckingParseInt(props.width) +
                typeCheckingParseInt(props.border) * 2
            );
        });

        const slideHeight = computed<number>(() => {
            const sw =
                typeCheckingParseInt(props.width) +
                typeCheckingParseInt(props.border) * 2;
            const sh =
                typeCheckingParseInt(props.height) +
                typeCheckingParseInt(props.border) * 2;
            const ar = calculateAspectRatio(sw, sh);

            return slideWidth.value / ar;
        });

        const visible = computed<number | string>(() => {
            const v = props.display > total.value ? total.value : props.display;
            return v;
        });

        const hasHiddenSlides = computed<boolean>(() => {
            return total.value > typeCheckingParseInt(visible.value);
        });

        const leftIndices = computed(() => {
            let n = (typeCheckingParseInt(visible.value) - 1) / 2;

            n =
                props.bias.toLowerCase() === "left"
                    ? Math.ceil(n)
                    : Math.floor(n);

            const indices = [];

            for (let m = 1; m <= n; m++) {
                indices.push(
                    props.dir === "ltr"
                        ? (currentIndex.value + m) % total.value
                        : (currentIndex.value - m) % total.value
                );
            }

            return indices;
        });

        const rightIndices = computed(() => {
            let n = (typeCheckingParseInt(visible.value) - 1) / 2;

            n =
                props.bias.toLowerCase() === "right"
                    ? Math.ceil(n)
                    : Math.floor(n);
            const indices = [];

            for (let m = 1; m <= n; m++) {
                indices.push(
                    props.dir === "ltr"
                        ? (currentIndex.value - m) % total.value
                        : (currentIndex.value + m) % total.value
                );
            }

            return indices;
        });
        const leftOutIndex = computed(() => {
            let n = (typeCheckingParseInt(visible.value) - 1) / 2;

            n =
                props.bias.toLowerCase() === "left"
                    ? Math.ceil(n)
                    : Math.floor(n);
            n++;

            if (props.dir === "ltr") {
                return total.value - currentIndex.value - n <= 0
                    ? -(total.value - currentIndex.value - n)
                    : currentIndex.value + n;
            } else {
                return currentIndex.value - n;
            }
        });

        const rightOutIndex = computed(() => {
            let n = (typeCheckingParseInt(visible.value) - 1) / 2;

            n =
                props.bias.toLowerCase() === "right"
                    ? Math.ceil(n)
                    : Math.floor(n);
            n++;

            if (props.dir === "ltr") {
                return currentIndex.value - n;
            } else {
                return total.value - currentIndex.value - n <= 0
                    ? -(total.value - currentIndex.value - n, 10)
                    : currentIndex.value + n;
            }
        });

        const animationEnd = () => {
            ctx.emit("after-slide-change", currentIndex);
        };

        const calculateAspectRatio = (width: number, height: number) => {
            return Math.min(width / height);
        };

        const goSlide = (index: number) => {
            currentIndex.value =
                index < 0 || index > total.value - 1 ? 0 : index;
            if (isLastSlide) {
                ctx.emit("last-slide", currentIndex);
            }

            ctx.emit("before-slide-change", currentIndex);

            setTimeout(
                () => animationEnd(),
                typeCheckingParseInt(props.animationSpeed)
            );
        };

        const goPrev = (): void => {
            if (isPrevPossible.value) {
                isFirstSlide.value
                    ? goSlide(total.value - 1)
                    : goSlide(currentIndex.value - 1);
            }
        };

        const goNext = (): void => {
            if (isNextPossible.value) {
                isLastSlide.value
                    ? goSlide(0)
                    : goSlide(currentIndex.value + 1);
            }
        };

        const goFar = (index: number) => {
            let diff =
                index === total.value - 1 && isFirstSlide.value
                    ? -1
                    : index - currentIndex.value;

            if (isLastSlide.value && index === 0) {
                diff = 1;
            }

            const diff2 = diff < 0 ? -diff : diff;
            let timeBuff = 0;
            let i = 0;

            while (i < diff2) {
                i += 1;
                const timeout = diff2 === 1 ? 0 : timeBuff;

                setTimeout(() => (diff < 0 ? goPrev() : goNext()), timeout);

                timeBuff += typeCheckingParseInt(props.animationSpeed) / diff2;
            }
        };

        const handleMousedown = (e: MouseEvent | TouchEvent) => {
            mousedown.value = true;
            if (e instanceof MouseEvent) {
                dragStartX.value = e.clientX;
                dragOffsetY.value = e.clientY;
            }
            if (e instanceof TouchEvent) {
                if (!e.touches) {
                    e.preventDefault();
                }
                dragStartX.value = e.touches[0].clientX;
                dragStartY.value = e.touches[0].clientY;
            }
        };

        const handleMousemove = (e: MouseEvent | TouchEvent) => {
            let eventPosX: number = 0;
            let eventPosY: number = 0;

            if (!mousedown.value) {
                return;
            }
            if (e instanceof MouseEvent) {
                eventPosX = e.clientX;
                eventPosY = e.clientY;
            }

            if (e instanceof TouchEvent) {
                eventPosX = e.touches[0].clientX;
                eventPosY = e.touches[0].clientY;
            }

            const deltaX: number = dragStartX.value - eventPosX;
            const deltaY: number = dragStartY.value - eventPosY;

            dragOffsetX.value = deltaX;
            dragOffsetY.value = deltaY;

            // If the swipe is more significant on the Y axis, do not move the slides because this is a scroll gesture
            if (Math.abs(dragOffsetY.value) > Math.abs(dragOffsetX.value)) {
                return;
            }

            if (dragOffsetX.value > props.minSwipeDistance) {
                handleMouseup();
                goNext();
            } else if (dragOffsetX.value < -props.minSwipeDistance) {
                handleMouseup();
                goPrev();
            }
        };

        const handleMouseup = () => {
            mousedown.value = false;
            dragOffsetX.value = 0;
            dragOffsetY.value = 0;
        };
        const attachMutationObserver = () => {
            const MutationObserver = window.MutationObserver;

            if (MutationObserver) {
                const config = {
                    attributes: true,
                    childList: true,
                    characterData: true,
                };

                mutationObserver.value = new MutationObserver(() => {
                    nextTick(() => {
                        computeData();
                    });
                });

                if (el.value) {
                    mutationObserver.value.observe(el.value, config);
                }
            }
        };

        const computeData = (firstRun?: boolean) => {
            total.value = getSlideCount();
            if (firstRun || currentIndex.value >= total.value) {
                currentIndex.value =
                    typeCheckingParseInt(props.startIndex) > total.value - 1
                        ? total.value - 1
                        : typeCheckingParseInt(props.startIndex);
            }
            if (el.value) {
                viewport.value = el.value.clientWidth;
            }
        };

        const setSize = () => {
            if (el.value) {
                el.value.style.cssText += "height:" + slideHeight.value + "px;";

                el.value.children[0].style +=
                    "width:" +
                    slideWidth.value +
                    "px;" +
                    " height:" +
                    slideHeight.value +
                    "px;";
            }
        };

        const getSlideCount = () => {
            return props.slides.length;
        };

        const detachMutationObserver = () => {
            if (mutationObserver.value) {
                mutationObserver.value.disconnect();
            }
        };
        const {
            oneDirectional,
            height,
            width,
            disable3d,
            perspective,
            space,
            inverseScaling,
            animationSpeed,
            transparent,
            clickable,
            onMainSlideClick,
        } = props;
        provide<ComputedRef<boolean>>("isPrevPossible", isPrevPossible);
        provide<ComputedRef<boolean>>("isNextPossible", isNextPossible);
        provide<Function>("goPrev", goPrev);
        provide<Function>("goNext", goNext);
        provide<Function>("goFar", goFar);
        provide<Ref<number>>("currentIndex", currentIndex);
        provide("oneDirectional", oneDirectional);
        provide<ComputedRef<number[]>>("rightIndices", rightIndices);
        provide<ComputedRef<number[]>>("leftIndices", leftIndices);
        provide<Ref<number>>("total", total);
        provide<boolean>("disable3d", disable3d);
        provide<number | string>("width", width);
        provide<number | string>("height", height);
        provide<number | string>("perspective", perspective);
        provide<number | string>("space", space);
        provide<number | string>("inverseScaling", inverseScaling);
        provide<ComputedRef<boolean>>("hasHiddenSlides", hasHiddenSlides);
        provide<ComputedRef<number>>("leftOutIndex", leftOutIndex);
        provide<ComputedRef<number>>("rightOutIndex", rightOutIndex);
        provide<ComputedRef<number>>("slideHeight", slideHeight);
        provide<ComputedRef<number>>("slideWidth", slideWidth);
        provide<number | string>("animationSpeed", animationSpeed);
        provide<boolean>("transparent", transparent);
        provide<boolean>("clickable", clickable);
        provide("onMainSlideClick", onMainSlideClick);
        return {
            el,
            rightOutIndex,
            leftOutIndex,
            rightIndices,
            leftIndices,
            hasHiddenSlides,
            visible,
            slideHeight,
            slideWidth,
            viewport,
            currentIndex,
            total,
            dragOffsetX,
            dragStartX,
            dragOffsetY,
            dragStartY,
            mousedown,
            zIndex,
            isLastSlide,
            isFirstSlide,
            isNextPossible,
            isPrevPossible,
            detachMutationObserver,
            setSize,
            attachMutationObserver,
            goSlide,
            computeData,
            handleMousemove,
            goFar,
            handleMousedown,
            animationEnd,
            goPrev,
            goNext,
            handleMouseup,
        };
    },

    mixins: [autoplay],
    watch: {
        count(): void {
            this.computeData();
        },
    },

    mounted() {
        this.computeData(true);
        this.attachMutationObserver();
        window.addEventListener("resize", this.setSize);

        if ("ontouchstart" in window) {
            this.$el.addEventListener("touchstart", this.handleMousedown);
            this.$el.addEventListener("touchend", this.handleMouseup);
            this.$el.addEventListener("touchmove", this.handleMousemove);
        } else {
            this.$el.addEventListener("mousedown", this.handleMousedown);
            this.$el.addEventListener("mouseup", this.handleMouseup);
            this.$el.addEventListener("mousemove", this.handleMousemove);
        }
    },

    beforeDestroy() {
        this.detachMutationObserver();

        if ("ontouchstart" in window) {
            this.$el.removeEventListener("touchmove", this.handleMousemove);
        } else {
            this.$el.removeEventListener("mousemove", this.handleMousemove);
        }

        window.removeEventListener("resize", this.setSize);
    },
});
</script>

<style scoped>
.carousel-3d-container {
    min-height: 1px;
    width: 100%;
    position: relative;
    z-index: 0;
    overflow: hidden;
    margin: 20px auto;
    box-sizing: border-box;
}

.carousel-3d-slider {
    position: relative;
    margin: 0 auto;
    transform-style: preserve-3d;
    -webkit-perspective: 1000px;
    -moz-perspective: 1000px;
    perspective: 1000px;
}
</style>
