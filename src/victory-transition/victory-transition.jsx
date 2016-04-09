import React from "react";
import { Transitions, VictoryAnimation } from "../index";
import defaults from "lodash/defaults";
import assign from "lodash/assign";
import pick from "lodash/pick";


export default class VictoryTransition extends React.Component {
  static propTypes = {
    /**
     * The child of should be a function that takes an object of tweened values
     * and returns a component to render.
     */
    animate: React.PropTypes.object,
    children: React.PropTypes.node,
    defaultTransitions: React.PropTypes.object,
    animationWhitelist: React.PropTypes.array
  };

  componentWillReceiveProps(nextProps) {
    const { animate }= this.props;
    if (!animate) {
      return;
    }
    if (animate.parentState){
      const oldProps = animate.parentState.nodesWillExit ? this.props : null;
      this.setState(assign({}, animate.state, {oldProps}));
    } else {
      const {
        nodesWillExit,
        nodesWillEnter,
        childrenTransitions,
        nodesShouldEnter
      } = Transitions.getInitialTransitionState([this.props.children], [nextProps.children]);

      this.setState({
        nodesWillExit,
        nodesWillEnter,
        childrenTransitions,
        nodesShouldEnter,
        oldProps: nodesWillExit ? this.props : null
      });
    }
  }

  render() {
    const props = this.state && this.state.nodesWillExit ?
      this.state.oldProps : this.props;
    const getTransitionProps = this.props.animate && this.props.animate.getTransitions ?
      this.props.animate.getTransitions :
      Transitions.getTransitionPropsFactory(
        props,
        this.state,
        (newState) => this.setState(newState)
      );
    const child = React.Children.toArray(props.children)[0];
    const domain = {
      x: child.type.getDomain(child.props, "x"),
      y: child.type.getDomain(child.props, "y")
    };
    const transitionProps = getTransitionProps(child);
    // Do less work by having `VictoryAnimation` tween only values that
    // make sense to tween. In the future, allow customization of animated
    // prop whitelist/blacklist?
    const combinedProps = defaults({domain}, transitionProps, child.props);
    const propsToAnimate = props.animationWhitelist ?
      pick(combinedProps, props.animationWhitelist) : combinedProps;

    return (
      <VictoryAnimation {...combinedProps.animate} data={propsToAnimate}>
        {(newProps) => {
          return React.cloneElement(child, defaults({animate: null}, newProps, combinedProps));
        }}
      </VictoryAnimation>
    );
  }
}
