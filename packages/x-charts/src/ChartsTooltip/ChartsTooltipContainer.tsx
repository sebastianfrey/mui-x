'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import HTMLElementType from '@mui/utils/HTMLElementType';
import useLazyRef from '@mui/utils/useLazyRef';
import { styled, useThemeProps } from '@mui/material/styles';
import Popper, { PopperProps } from '@mui/material/Popper';
import NoSsr from '@mui/material/NoSsr';
import { rafThrottle } from '@mui/x-internals/rafThrottle';
import { TriggerOptions, useIsFineMainPointer, usePointerType } from './utils';
import { ChartsTooltipClasses, useUtilityClasses } from './chartsTooltipClasses';
import { useSelector } from '../internals/store/useSelector';
import { useStore } from '../internals/store/useStore';
import { selectorChartsInteractionItemIsDefined } from '../internals/plugins/featurePlugins/useChartInteraction';
import {
  selectorChartsInteractionAxisTooltip,
  UseChartCartesianAxisSignature,
} from '../internals/plugins/featurePlugins/useChartCartesianAxis';
import { selectorChartsInteractionPolarAxisTooltip } from '../internals/plugins/featurePlugins/useChartPolarAxis/useChartPolarInteraction.selectors';
import { useAxisSystem } from '../hooks/useAxisSystem';
import { useSvgRef } from '../hooks';

const noAxis = () => false;

export interface ChartsTooltipContainerProps extends Partial<PopperProps> {
  /**
   * Select the kind of tooltip to display
   * - 'item': Shows data about the item below the mouse.
   * - 'axis': Shows values associated with the hovered x value
   * - 'none': Does not display tooltip
   * @default 'axis'
   */
  trigger?: TriggerOptions;
  /**
   * Override or extend the styles applied to the component.
   */
  classes?: Partial<ChartsTooltipClasses>;
  children?: React.ReactNode;
}

const ChartsTooltipRoot = styled(Popper, {
  name: 'MuiChartsTooltip',
  slot: 'Root',
})(({ theme }) => ({
  pointerEvents: 'none',
  zIndex: theme.zIndex.modal,
}));

/**
 * Demos:
 *
 * - [ChartsTooltip](https://mui.com/x/react-charts/tooltip/)
 *
 * API:
 *
 * - [ChartsTooltip API](https://mui.com/x/api/charts/charts-tool-tip/)
 */
function ChartsTooltipContainer(inProps: ChartsTooltipContainerProps) {
  const props = useThemeProps({
    props: inProps,
    name: 'MuiChartsTooltipContainer',
  });
  const { trigger = 'axis', classes: propClasses, children, ...other } = props;
  const svgRef = useSvgRef();
  const classes = useUtilityClasses(propClasses);

  const pointerType = usePointerType();
  const isFineMainPointer = useIsFineMainPointer();

  const popperRef: PopperProps['popperRef'] = React.useRef(null);
  const positionRef = useLazyRef(() => ({ x: 0, y: 0 }));

  const axisSystem = useAxisSystem();

  const store = useStore<[UseChartCartesianAxisSignature]>();
  const isOpen = useSelector(
    store,
    trigger === 'axis'
      ? (axisSystem === 'polar' && selectorChartsInteractionPolarAxisTooltip) ||
          (axisSystem === 'cartesian' && selectorChartsInteractionAxisTooltip) ||
          noAxis
      : selectorChartsInteractionItemIsDefined,
  );

  React.useEffect(() => {
    const element = svgRef.current;
    if (element === null) {
      return () => {};
    }

    const update = rafThrottle(() => popperRef.current?.update());

    const handlePointerEvent = (event: PointerEvent) => {
      // eslint-disable-next-line react-compiler/react-compiler
      positionRef.current = { x: event.clientX, y: event.clientY };
      update();
    };

    element.addEventListener('pointerdown', handlePointerEvent);
    element.addEventListener('pointermove', handlePointerEvent);

    return () => {
      element.removeEventListener('pointerdown', handlePointerEvent);
      element.removeEventListener('pointermove', handlePointerEvent);
      update.clear();
    };
  }, [svgRef, positionRef]);

  const anchorEl = React.useMemo(
    () => ({
      getBoundingClientRect: () => ({
        x: positionRef.current.x,
        y: positionRef.current.y,
        top: positionRef.current.y,
        left: positionRef.current.x,
        right: positionRef.current.x,
        bottom: positionRef.current.y,
        width: 0,
        height: 0,
        toJSON: () => '',
      }),
    }),
    [positionRef],
  );

  const isMouse = pointerType?.pointerType === 'mouse' || isFineMainPointer;
  const isTouch = pointerType?.pointerType === 'touch' || !isFineMainPointer;

  const modifiers = React.useMemo(
    () => [
      {
        name: 'offset',
        options: {
          offset: () => {
            if (isTouch) {
              return [0, 64];
            }
            // The popper offset: [skidding, distance]
            return [0, 8];
          },
        },
      },
      ...(!isMouse
        ? [
            {
              name: 'flip',
              options: {
                fallbackPlacements: ['top-end', 'top-start', 'bottom-end', 'bottom'],
              },
            },
          ]
        : []), // Keep default behavior
    ],
    [isMouse, isTouch],
  );

  if (trigger === 'none') {
    return null;
  }

  return (
    <NoSsr>
      {isOpen && (
        <ChartsTooltipRoot
          className={classes?.root}
          open={isOpen}
          placement={isMouse ? 'right-start' : 'top'}
          popperRef={popperRef}
          anchorEl={anchorEl}
          modifiers={modifiers}
          {...other}
        >
          {children}
        </ChartsTooltipRoot>
      )}
    </NoSsr>
  );
}

ChartsTooltipContainer.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * An HTML element, [virtualElement](https://popper.js.org/docs/v2/virtual-elements/),
   * or a function that returns either.
   * It's used to set the position of the popper.
   * The return value will passed as the reference object of the Popper instance.
   */
  anchorEl: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * Popper render function or node.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The components used for each slot inside the Popper.
   * Either a string to use a HTML element or a component.
   *
   * @deprecated use the `slots` prop instead. This prop will be removed in a future major release. [How to migrate](/material-ui/migration/migrating-from-deprecated-apis/).
   * @default {}
   */
  components: PropTypes.shape({
    Root: PropTypes.elementType,
  }),
  /**
   * The props used for each slot inside the Popper.
   *
   * @deprecated use the `slotProps` prop instead. This prop will be removed in a future major release. [How to migrate](/material-ui/migration/migrating-from-deprecated-apis/).
   * @default {}
   */
  componentsProps: PropTypes.shape({
    root: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  }),
  /**
   * An HTML element or function that returns one.
   * The `container` will have the portal children appended to it.
   *
   * You can also provide a callback, which is called in a React layout effect.
   * This lets you set the container from a ref, and also makes server-side rendering possible.
   *
   * By default, it uses the body of the top-level document object,
   * so it's simply `document.body` most of the time.
   */
  container: PropTypes.oneOfType([
    (props, propName) => {
      if (props[propName] == null) {
        return new Error(`Prop '${propName}' is required but wasn't specified`);
      }
      if (typeof props[propName] !== 'object' || props[propName].nodeType !== 1) {
        return new Error(`Expected prop '${propName}' to be of type Element`);
      }
      return null;
    },
    PropTypes.func,
  ]),
  /**
   * The `children` will be under the DOM hierarchy of the parent component.
   * @default false
   */
  disablePortal: PropTypes.bool,
  /**
   * Always keep the children in the DOM.
   * This prop can be useful in SEO situation or
   * when you want to maximize the responsiveness of the Popper.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * Popper.js is based on a "plugin-like" architecture,
   * most of its features are fully encapsulated "modifiers".
   *
   * A modifier is a function that is called each time Popper.js needs to
   * compute the position of the popper.
   * For this reason, modifiers should be very performant to avoid bottlenecks.
   * To learn how to create a modifier, [read the modifiers documentation](https://popper.js.org/docs/v2/modifiers/).
   */
  modifiers: PropTypes.arrayOf(
    PropTypes.shape({
      data: PropTypes.object,
      effect: PropTypes.func,
      enabled: PropTypes.bool,
      fn: PropTypes.func,
      name: PropTypes.any,
      options: PropTypes.object,
      phase: PropTypes.oneOf([
        'afterMain',
        'afterRead',
        'afterWrite',
        'beforeMain',
        'beforeRead',
        'beforeWrite',
        'main',
        'read',
        'write',
      ]),
      requires: PropTypes.arrayOf(PropTypes.string),
      requiresIfExists: PropTypes.arrayOf(PropTypes.string),
    }),
  ),
  /**
   * If `true`, the component is shown.
   */
  open: PropTypes.bool,
  /**
   * Popper placement.
   * @default 'bottom'
   */
  placement: PropTypes.oneOf([
    'auto-end',
    'auto-start',
    'auto',
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top',
  ]),
  /**
   * Options provided to the [`Popper.js`](https://popper.js.org/docs/v2/constructors/#options) instance.
   * @default {}
   */
  popperOptions: PropTypes.shape({
    modifiers: PropTypes.array,
    onFirstUpdate: PropTypes.func,
    placement: PropTypes.oneOf([
      'auto-end',
      'auto-start',
      'auto',
      'bottom-end',
      'bottom-start',
      'bottom',
      'left-end',
      'left-start',
      'left',
      'right-end',
      'right-start',
      'right',
      'top-end',
      'top-start',
      'top',
    ]),
    strategy: PropTypes.oneOf(['absolute', 'fixed']),
  }),
  /**
   * A ref that points to the used popper instance.
   */
  popperRef: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.shape({
      current: PropTypes.shape({
        destroy: PropTypes.func.isRequired,
        forceUpdate: PropTypes.func.isRequired,
        setOptions: PropTypes.func.isRequired,
        state: PropTypes.shape({
          attributes: PropTypes.object.isRequired,
          elements: PropTypes.object.isRequired,
          modifiersData: PropTypes.object.isRequired,
          options: PropTypes.object.isRequired,
          orderedModifiers: PropTypes.arrayOf(PropTypes.object).isRequired,
          placement: PropTypes.oneOf([
            'auto-end',
            'auto-start',
            'auto',
            'bottom-end',
            'bottom-start',
            'bottom',
            'left-end',
            'left-start',
            'left',
            'right-end',
            'right-start',
            'right',
            'top-end',
            'top-start',
            'top',
          ]).isRequired,
          rects: PropTypes.object.isRequired,
          reset: PropTypes.bool.isRequired,
          scrollParents: PropTypes.object.isRequired,
          strategy: PropTypes.oneOf(['absolute', 'fixed']).isRequired,
          styles: PropTypes.object.isRequired,
        }).isRequired,
        update: PropTypes.func.isRequired,
      }),
    }),
  ]),
  /**
   * The props used for each slot inside the Popper.
   * @default {}
   */
  slotProps: PropTypes.object,
  /**
   * The components used for each slot inside the Popper.
   * Either a string to use a HTML element or a component.
   * @default {}
   */
  slots: PropTypes.object,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
  /**
   * Help supporting a react-transition-group/Transition component.
   * @default false
   */
  transition: PropTypes.bool,
  /**
   * Select the kind of tooltip to display
   * - 'item': Shows data about the item below the mouse.
   * - 'axis': Shows values associated with the hovered x value
   * - 'none': Does not display tooltip
   * @default 'axis'
   */
  trigger: PropTypes.oneOf(['axis', 'item', 'none']),
} as any;

export { ChartsTooltipContainer };
