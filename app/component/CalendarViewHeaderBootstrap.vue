<template>
	<div class="cv-header">
		<div class="cv-header-nav btn-group btn-group-xs">
			<button :disabled="!headerProps.previousYear" class="btn btn-default" @click="onInput(headerProps.previousYear)"><span class="glyphicon glyphicon-backward"></span></button>
			<button :disabled="!headerProps.previousPeriod" class="btn btn-default" @click="onInput(headerProps.previousPeriod)"><span class="glyphicon glyphicon-chevron-left"></span></button>
			<button :disabled="!headerProps.nextPeriod" class="btn btn-default" @click="onInput(headerProps.nextPeriod)"><span class="glyphicon glyphicon-chevron-right"></span></button>
			<button :disabled="!headerProps.nextYear" class="btn btn-default" @click="onInput(headerProps.nextYear)"><span class="glyphicon glyphicon-forward"></span></button>
			<button class="btn btn-default" @click="onInput(headerProps.currentPeriod)">{{$l10n('calendarToday')}}</button>
		</div>
		<div class="periodLabel">
			<slot name="label">
				{{ headerProps.periodLabel }}
			</slot>
		</div>
	</div>
</template>
<script>
import L10n from './L10n'

export default {
	name: "CalendarViewHeaderBootstrap",
	props: {
		headerProps: {
			type: Object,
			required: true,
		},
	},
	methods: {
		onInput(d) {
			this.$emit("input", d)
		},
	},
}
</script>