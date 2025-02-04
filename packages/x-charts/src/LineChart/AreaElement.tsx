import * as React from 'react';
import PropTypes from 'prop-types';
import composeClasses from '@mui/utils/composeClasses';
import generateUtilityClass from '@mui/utils/generateUtilityClass';
import { styled } from '@mui/material/styles';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
import { color as d3Color } from 'd3-color';
import { useInteractionItemProps } from '../hooks/useInteractionItemProps';
import { InteractionContext } from '../context/InteractionProvider';

export interface AreaElementClasses {
  /** Styles applied to the root element. */
  root: string;
  /** Styles applied to the root element when higlighted. */
  highlighted: string;
  /** Styles applied to the root element when faded. */
  faded: string;
}
export interface AreaElementOwnerState {
  id: string;
  color: string;
  isNotHighlighted: boolean;
  isHighlighted: boolean;
  classes?: Partial<AreaElementClasses>;
}

export function getAreaElementUtilityClass(slot: string) {
  return generateUtilityClass('MuiAreaElement', slot);
}

export const areaElementClasses: AreaElementClasses = generateUtilityClasses('MuiAreaElement', [
  'root',
  'highlighted',
  'faded',
]);

const useUtilityClasses = (ownerState: AreaElementOwnerState) => {
  const { classes, id, isNotHighlighted, isHighlighted } = ownerState;
  const slots = {
    root: ['root', `series-${id}`, isHighlighted && 'highlighted', isNotHighlighted && 'faded'],
  };

  return composeClasses(slots, getAreaElementUtilityClass, classes);
};

const AreaElementPath = styled('path', {
  name: 'MuiAreaElement',
  slot: 'Root',
  overridesResolver: (_, styles) => styles.root,
})<{ ownerState: AreaElementOwnerState }>(({ ownerState }) => ({
  stroke: 'none',
  fill: d3Color(ownerState.color)!.brighter(1).formatHex(),
  opacity: ownerState.isNotHighlighted ? 0.3 : 1,
}));

AreaElementPath.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  as: PropTypes.elementType,
  ownerState: PropTypes.shape({
    classes: PropTypes.object,
    color: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    isHighlighted: PropTypes.bool.isRequired,
    isNotHighlighted: PropTypes.bool.isRequired,
  }).isRequired,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])),
    PropTypes.func,
    PropTypes.object,
  ]),
} as any;

export type AreaElementProps = Omit<AreaElementOwnerState, 'isNotHighlighted' | 'isHighlighted'> &
  React.ComponentPropsWithoutRef<'path'>;

function AreaElement(props: AreaElementProps) {
  const { id, classes: innerClasses, color, ...other } = props;

  const getInteractionItemProps = useInteractionItemProps();

  const { item } = React.useContext(InteractionContext);
  const someSeriesIsHighlighted = item !== null;
  const isHighlighted = item !== null && item.type === 'line' && item.seriesId === id;

  const ownerState = {
    id,
    classes: innerClasses,
    color,
    isNotHighlighted: someSeriesIsHighlighted && !isHighlighted,
    isHighlighted,
  };
  const classes = useUtilityClasses(ownerState);

  return (
    <AreaElementPath
      {...other}
      ownerState={ownerState}
      className={classes.root}
      {...getInteractionItemProps({ type: 'line', seriesId: id })}
    />
  );
}

AreaElement.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  classes: PropTypes.object,
} as any;

export { AreaElement };
