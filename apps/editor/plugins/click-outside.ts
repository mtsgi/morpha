// @ts-expect-error Nuxt auto-imports
export default defineNuxtPlugin((nuxtApp: any) => {
  nuxtApp.vueApp.directive('click-outside', {
    mounted(el: any, binding: any) {
      el.clickOutsideEvent = (event: MouseEvent) => {
        // 対象の要素そのもの、またはその子要素でなければコールバックを実行
        if (!(el === event.target || el.contains(event.target as Node))) {
          binding.value(event);
        }
      };
      // 次のティックでイベントリスナーを追加して、開いた瞬間のクリックで即座に閉じないようにする
      setTimeout(() => {
        document.addEventListener('click', el.clickOutsideEvent);
      }, 0);
    },
    unmounted(el: any) {
      if (el.clickOutsideEvent) {
        document.removeEventListener('click', el.clickOutsideEvent);
      }
    },
  });
});
