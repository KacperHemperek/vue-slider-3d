<template>
    <div
        class="carousel-3d-slide"
        :style="slideStyle"
        :class="computedClasses"
        @click="goTo()"
    >
        <slot
            :index="index"
            :isCurrent="isCurrent"
            :leftIndex="leftIndex"
            :rightIndex="rightIndex"
        />
    </div>
</template>

<script lang="ts">
import { computed, defineComponent, inject, ref } from "vue";
import type { Ref, ComputedRef } from "vue";
import { injectStrict, typeCheckingParseInt } from "@/lib/helpers";

export default defineComponent({
    name: "slide",
    props: {
        index: {
            type: Number,
        },
    },
    data() {
        return {
            parent: this.$parent,
            styles: {},
            zIndex: 999,
        };
    },
    setup(props) {
        const zIndex = ref<number>(999);

        const goFar = injectStrict<Function>("goFar");
        const currentIndex = injectStrict<Ref<number>>("currentIndex");
        const oneDirectional = injectStrict("oneDirectional");
        const rightIndices =
            injectStrict<ComputedRef<number[]>>("rightIndices");
        const total = injectStrict<Ref<number>>("total");
        const leftIndices = injectStrict<ComputedRef<number[]>>("leftIndices");
        const disable3d = injectStrict<boolean>("disable3d");
        const width = injectStrict<number | string>("width");
        const height = injectStrict<number | string>("height");
        const perspective = injectStrict<number | string>("perspective");
        const space = injectStrict<number | string>("space");
        const inverseScaling = injectStrict<number | string>("inverseScaling");
        const hasHiddenSlides =
            injectStrict<ComputedRef<boolean>>("hasHiddenSlides");
        const leftOutIndex = injectStrict<ComputedRef<number>>("leftOutIndex");
        const rightOutIndex =
            injectStrict<ComputedRef<number>>("rightOutIndex");
        const slideHeight = injectStrict<ComputedRef<number>>("slideHeight");
        const slideWidth = injectStrict<ComputedRef<number>>("slideWidth");
        const animationSpeed = injectStrict<number | string>("animationSpeed");
        const transparent = injectStrict<boolean>("transparent");
        const clickable = injectStrict<boolean>("clickable");
        const onMainSlideClick = injectStrict<Function>("onMainSlideClick");

        //computed properties
        const isCurrent = computed<boolean>(() => {
            return props.index === currentIndex?.value;
        });

        const leftIndex = computed(() => {
            if (
                oneDirectional &&
                getSideIndex(leftIndices.value) > currentIndex.value - 1
            )
                return -1;

            return getSideIndex(leftIndices.value);
        });

        const rightIndex = computed(() => {
            if (
                oneDirectional &&
                getSideIndex(rightIndices.value) >
                    total.value - currentIndex.value - 2
            )
                return -1;

            return getSideIndex(rightIndices.value);
        });

        const slideStyle = computed(() => {
            let styles: any = {};

            if (!isCurrent.value) {
                const lIndex = leftIndex.value;
                const rIndex = rightIndex.value;
                if (rIndex >= 0 || lIndex >= 0) {
                    styles =
                        rIndex >= 0
                            ? calculatePosition(rIndex, true, zIndex.value)
                            : calculatePosition(lIndex, false, zIndex.value);
                    styles.opacity = 1;
                    styles.visibility = "visible";
                }

                if (hasHiddenSlides.value) {
                    if (matchIndex(leftOutIndex.value)) {
                        styles = calculatePosition(
                            leftIndices.value.length - 1,
                            false,
                            zIndex.value
                        );
                    } else if (matchIndex(rightOutIndex.value)) {
                        styles = calculatePosition(
                            rightIndices.value.length - 1,
                            true,
                            zIndex.value
                        );
                    }
                }
            }
            console.log(slideHeight.value);
            return Object.assign(styles, {
                width: String(slideWidth.value) + "px",
                height: String(slideHeight.value) + "px",
                transition:
                    " transform " +
                    +"ms, " +
                    "               opacity " +
                    animationSpeed +
                    "ms, " +
                    "               visibility " +
                    animationSpeed +
                    "ms, " +
                    "               filter " +
                    (typeCheckingParseInt(animationSpeed) - 200 <= 0)
                        ? typeCheckingParseInt(animationSpeed) + "ms"
                        : typeCheckingParseInt(animationSpeed) - 200 + "ms",
            });
        });

        const computedClasses = computed(() => {
            return {
                [`left-${leftIndex.value + 1} `]: leftIndex.value >= 0,
                [`right-${rightIndex.value + 1} `]: rightIndex.value >= 0,
                current: isCurrent.value,
                opacity: transparent,
            };
        });

        //methods
        const getSideIndex = (array: number[]) => {
            let index = -1;

            array.forEach((pos, i) => {
                if (matchIndex(pos)) {
                    index = i;
                }
            });

            return index;
        };

        const matchIndex = (index: number) => {
            return index >= 0
                ? props.index === index
                : total.value + index === props.index;
        };

        const calculatePosition = (
            i: number,
            positive: boolean,
            zIndex: number
        ) => {
            const z = !disable3d
                ? typeCheckingParseInt(inverseScaling) + (i + 1) * 100
                : 0;
            const y = !disable3d ? typeCheckingParseInt(perspective) : 0;
            const leftRemain =
                space === "auto"
                    ? ((i + 1) * typeCheckingParseInt(width)) / 1.5
                    : (i + 1) * typeCheckingParseInt(space);
            const transform = positive
                ? "translateX(" +
                  leftRemain +
                  "px) translateZ(-" +
                  z +
                  "px) " +
                  "rotateY(-" +
                  y +
                  "deg)"
                : "translateX(-" +
                  leftRemain +
                  "px) translateZ(-" +
                  z +
                  "px) " +
                  "rotateY(" +
                  y +
                  "deg)";
            const top =
                space === "auto"
                    ? 0
                    : typeCheckingParseInt(
                          (i + 1) * typeCheckingParseInt(space)
                      );

            return {
                transform: transform,
                top: top,
                zIndex: zIndex - (Math.abs(i) + 1),
            };
        };

        const goTo = () => {
            if (!isCurrent.value) {
                if (clickable === true) {
                    goFar(props.index);
                }
            } else {
                const { index } = props;
                onMainSlideClick({ index });
            }
        };

        return {
            computedClasses,
            zIndex,
            disable3d,
            slideStyle,
            rightIndex,
            leftIndex,
            oneDirectional,
            rightIndices,
            goFar,
            isCurrent,
            getSideIndex,
            calculatePosition,
            goTo,
        };
    },

    computed: {},
    methods: {},
});
</script>

<style>
.carousel-3d-slide {
    position: absolute;
    opacity: 0;
    visibility: hidden;
    overflow: hidden;
    top: 0;
    -webkit-box-shadow: 0px 0px 36px -21px rgba(66, 68, 90, 1);
    -moz-box-shadow: 0px 0px 36px -21px rgba(66, 68, 90, 1);
    box-shadow: 0px 0px 36px -21px rgba(66, 68, 90, 1);
    background-size: cover;
    background-color: #ccc;
    display: block;
    margin: 0;
    box-sizing: border-box;
}
.carousel-3d-slide.opacity {
    filter: opacity(40%);
}

.carousel-3d-slide {
    text-align: left;
}

.carousel-3d-slide img {
    width: 100%;
}

.carousel-3d-slide.current {
    opacity: 1 !important;
    visibility: visible !important;
    transform: none !important;
    z-index: 999;
}
.carousel-3d-slide.current.opacity {
    filter: opacity(100%);
}
</style>
