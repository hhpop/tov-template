import { isPackageExists } from 'local-pkg'
import Prism from 'markdown-it-prism'
import { resolve } from 'path'
import { argv } from 'process'
import UnoCss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import {
	AntDesignVueResolver,
	ArcoResolver,
	DevUiResolver,
	ElementPlusResolver,
	HeadlessUiResolver,
	IduxResolver,
	InklineResolver,
	LayuiVueResolver,
	NaiveUiResolver,
	PrimeVueResolver,
	QuasarResolver,
	TDesignResolver,
	VantResolver,
	VarletUIResolver,
	ViewUiResolver,
	Vuetify3Resolver,
	VueUseComponentsResolver,
} from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
// @ts-ignore
import Marcos from 'unplugin-vue-macros/vite'
import { VueRouterAutoImports } from 'unplugin-vue-router'
import Router from 'unplugin-vue-router/vite'
import { loadEnv } from 'vite'
import { AutoGenerateImports } from 'vite-auto-import-resolvers'
import Compression from 'vite-plugin-compression'
import Inspect from 'vite-plugin-inspect'
import Markdown from 'vite-plugin-md'
import { viteMockServe as Mock } from 'vite-plugin-mock'
import Rmovelog from 'vite-plugin-removelog'
import Modules from 'vite-plugin-use-modules'
import Layouts from 'vite-plugin-vue-meta-layouts'
import { HtmlPolyfill } from 'vue-dark-switch/vite'
import { warmup as Warmup } from 'vite-plugin-warmup'

import I18N from '@intlify/unplugin-vue-i18n/vite'
import Vue from '@vitejs/plugin-vue'
import Jsx from '@vitejs/plugin-vue-jsx'

import type { Plugin } from 'vite'
import type { ComponentResolver } from 'unplugin-vue-components/types'

export default function () {
	const env = useEnv()
	const safelist =
		'prose px-2 sm:px-0 md:prose-lg lg:prose-lg dark:prose-invert text-left w-screen prose-slate prose-img:rounded-xl prose-headings:underline prose-a:text-blue-600'
	const plugins: Plugin[] = [
		// https://github.com/bluwy/vite-plugin-warmup (依赖预热，加快渲染，未来可能会内置到 vite 中)
		Warmup({
			clientFiles: ['./src/**/*'],
		}),
		// https://github.com/sxzz/unplugin-vue-macros/blob/main/README-zh-CN.md
		Marcos({
			hoistStatic: true,
			defineOptions: true,
		}),
		// https://github.com/posva/unplugin-vue-router
		Router({
			routesFolder: 'src/pages',
			extensions: ['.md', '.vue', '.tsx'],
			dts: 'presets/types/type-router.d.ts',
		}),
		// 模块自动加载
		Modules({
			auto: true,
		}),
		// 生成 title
		GenerateTitle(),
		// vue 官方插件，用来解析 sfc
		Vue({
			include: [/\.vue$/, /\.md$/],
		}),
		// 布局系统
		Layouts(),
		// 调试工具
		Inspect({
			enabled: env.VITE_APP_INSPECT,
		}),
		// mock 服务
		Mock({
			prodEnabled: env.VITE_APP_MOCK_IN_PRODUCTION,
		}),
		// https://icones.netlify.app/
		Icons({
			autoInstall: true,
		}),
		// 组件自动按需引入
		Components({
			extensions: ['md', 'vue', 'tsx'],
			dts: resolve(__dirname, './types/components.d.ts'),
			types: [
				{
					from: 'vue-router',
					names: ['RouterLink', 'RouterView'],
				},
			],
			resolvers: normalizeResolvers({
				onlyExist: [
					[VantResolver(), 'vant'],
					[QuasarResolver(), 'quasar'],
					[DevUiResolver(), 'vue-devui'],
					[NaiveUiResolver(), 'naive-ui'],
					[Vuetify3Resolver(), 'vuetify'],
					[PrimeVueResolver(), 'primevue'],
					[ViewUiResolver(), 'view-design'],
					[LayuiVueResolver(), 'layui-vue'],
					[VarletUIResolver(), '@varlet/ui'],
					[IduxResolver(), '@idux/components'],
					[TDesignResolver(), 'tdesign-vue-next'],
					[InklineResolver(), '@inkline/inkline'],
					[ElementPlusResolver(), 'element-plus'],
					[HeadlessUiResolver(), '@headlessui/vue'],
					[ArcoResolver(), '@arco-design/web-vue'],
					[AntDesignVueResolver(), 'ant-design-vue'],
					[VueUseComponentsResolver(), '@vueuse/components'],
				],
				include: [IconsResolver()],
			}),
		}),

		// i18n 国际化支持
		I18N({
			runtimeOnly: false,
			compositionOnly: true,
			include: ['locales/**'],
		}),
		// jsx 和 tsx 支持
		Jsx(),
		// 生产环境资源压缩
		Compression({
			// @ts-ignore
			algorithm: env.VITE_APP_COMPRESSINON_ALGORITHM,
		}),
		// 生产环境下移除 console.log, console.warn, console.error
		Rmovelog(),
		// https://github.com/dishait/vue-dark-switch#%E7%BC%96%E8%AF%91%E6%97%B6%E9%A2%84%E8%AE%BE---%E6%8E%A8%E8%8D%90
		HtmlPolyfill(),
	]

	if (env.VITE_APP_API_AUTO_IMPORT) {
		const dirs = env.VITE_APP_DIR_API_AUTO_IMPORT
			? ['src/stores/**/*.ts', 'src/composables/**/*.ts']
			: undefined
		// api 自动按需引入
		plugins.push(
			AutoImport({
				dirs,
				dts: './presets/types/auto-imports.d.ts',
				imports: [
					...AutoGenerateImports({ exclude: ['vue-router'] }),
					VueRouterAutoImports,
				],
				resolvers: isPackageExists('element-plus')
					? [ElementPlusResolver()]
					: [],
				eslintrc: {
					enabled: true,
					globalsPropValue: true,
					filepath: 'presets/eslint/.eslintrc-auto-import.json',
				},
			})
		)
	}

	if (env.VITE_APP_MARKDOWN) {
		plugins.push(
			Markdown({
				wrapperClasses: safelist,
				markdownItSetup(md) {
					md.use(Prism)
				},
			})
		)
	}
	plugins.push(
		// @ts-ignore
		UnoCss({
			safelist: env.VITE_APP_MARKDOWN ? safelist.split(' ') : undefined,
		})
	)

	return plugins
}

// 获取环境变量
function useEnv() {
	function detectMode() {
		const { NODE_ENV } = process.env
		const hasModeIndex = argv.findIndex((a) => a === '--mode' || a === '-m')
		if (hasModeIndex !== -1) {
			return argv[hasModeIndex + 1]
		}
		return NODE_ENV || 'development'
	}

	const stringToBoolean = (v: string) => {
		return Boolean(v === 'true' || false)
	}

	const env = loadEnv(detectMode(), '.')

	const {
		VITE_APP_TITLE,
		VITE_APP_INSPECT,
		VITE_APP_MARKDOWN,
		VITE_APP_API_AUTO_IMPORT,
		VITE_APP_MOCK_IN_PRODUCTION,
		VITE_APP_DIR_API_AUTO_IMPORT,
		VITE_APP_COMPRESSINON_ALGORITHM,
	} = env

	const newEnv = {
		VITE_APP_TITLE,
		VITE_APP_COMPRESSINON_ALGORITHM,
		VITE_APP_INSPECT: stringToBoolean(VITE_APP_INSPECT),
		VITE_APP_MARKDOWN: stringToBoolean(VITE_APP_MARKDOWN),
		VITE_APP_API_AUTO_IMPORT: stringToBoolean(VITE_APP_API_AUTO_IMPORT),
		VITE_APP_MOCK_IN_PRODUCTION: stringToBoolean(VITE_APP_MOCK_IN_PRODUCTION),
		VITE_APP_DIR_API_AUTO_IMPORT: stringToBoolean(VITE_APP_DIR_API_AUTO_IMPORT),
	}
	return newEnv
}

export function GenerateTitle(): Plugin {
	let title: string
	const reg = /<title>(.*?)<\/title>/
	return {
		name: 'vite-plugin-env-to-generate-title',
		configResolved(config) {
			title = config.env.VITE_APP_TITLE
		},
		transformIndexHtml(html) {
			return html.replace(reg, `<title>${title}</title>`)
		},
	}
}

type Arrayable<T> = T | Array<T>

interface Options {
	onlyExist?: [Arrayable<ComponentResolver>, string][]
	include?: ComponentResolver[]
}
export const normalizeResolvers = (options: Options = {}) => {
	const { onlyExist = [], include = [] } = options

	const existedResolvers = []
	for (let i = 0; i < onlyExist.length; i++) {
		const [resolver, packageName] = onlyExist[i]
		if (isPackageExists(packageName)) {
			existedResolvers.push(resolver)
		}
	}

	existedResolvers.push(...include)

	return existedResolvers
}
