const React = require('react') // eslint-disable-line no-unused-vars
    , {connect} = require('react-redux')
    , {bindActionCreators} = require('redux')
    , {List, Set} = require('immutable')
    , classnames = require('classnames')
    , { withRebass
      , Panel
      , PanelHeader
      , PanelFooter
      , Block
      , Heading
      , Text
      , Switch
      , Space
      } = require('rebass')
    , FlexRow = require('../components/FlexRow')
    , { getNode
      , getRootNodePath
      , getLabelResolver
      , getIDMinter
      , getProperties
      , isEditingProperties
      } = require('../selectors')
    , {toggleEditingProperties} = require('../actions')
    , ShowNode = require('./ShowNode')
    , Type = require('./Type')
    , Property = require('./Property')
    , AddProperty = require('./AddProperty')
    , {keyFromPath, labelOrID} = require('../utils')
    , {owl} = require('../namespaces')

const mapStateToProps = state => (
  { top: getNode(state)
  , path: getRootNodePath(state)
  , labelFor: getLabelResolver(state)
  , mintID: getIDMinter(state)
  , availableProperties: getProperties(state)
  , isEditingProperties: isEditingProperties(state)
  }
)

const mapDispatchToProps = dispatch => bindActionCreators(
  {toggleEditingProperties}, dispatch)

const renderPath = (top, path, labelFor) => path.reduce(
  ({subpath, elements}, part, index) => (
    { subpath: subpath.push(part)
    , elements: elements.push(
        index % 2 === 0 // alternates between nodes and properties
          ? <ShowNode
              key={`path-${index}`}
              path={subpath}
              deletable={false}
              mr={1}
            />
          : <Text
              key={`path-${index}`}
              mr={1}
            >
              { labelFor(subpath.last()) }
            </Text>
      )
    }
  ),
  {subpath: List(), elements: List()}
)

const component = (
  { top
  , path
  , labelFor
  , mintID
  , availableProperties
  , isEditingProperties
  , toggleEditingProperties
  , className
  , style
  , theme
  , subComponentStyles
  , ...props
  }) => {

  const {fontSizes} = theme

  const cx = classnames('EditNode', className)

  const {
    ...rootStyle
  } = style

  const sx =
    { root:
      { ...rootStyle }
    , addProperty:
      { fontSize: fontSizes[4]
      , ...subComponentStyles.addProperty
      }
    }

  const node = top.getIn(path)
  const properties = node.keySeq()

  const canAddProperty = (
    mintID.accepts(owl('DatatypeProperty')) ||
    mintID.accepts(owl('ObjectProperty'))   ||
    (! Set(availableProperties.keySeq()).subtract(properties).isEmpty())
  )

  return (
    <Panel
      className={cx}
      theme="muted"
      style={sx.root}
      {...props}
    >
      {
        path.isEmpty()
          ? ''
          : <PanelHeader theme="muted">
              {renderPath(top, path, labelFor).elements}
            </PanelHeader>
      }
      <Heading>{ labelOrID(node) }</Heading>

      <Block mb={3}>
        <Type path={path.push('@type')} />
        {
          node.propertySeq().map(([predicate, ]) => (
            <Property
              {...keyFromPath(path.push(predicate))}
            />
          ))
        }
        {
          canAddProperty
            ? <AddProperty
                { ...keyFromPath(
                    path.push(`new-property-${properties.count()}`))
                }
                exclude={properties}
                mt={2}
                style={sx.addProperty}
              />
            : null
        }
      </Block>
      <PanelFooter theme="muted">
        <FlexRow mt={0} margins={{mr: 1}}>
          <Switch
            checked={isEditingProperties}
            onClick={() => toggleEditingProperties()}
          />
          <Text
            style={{cursor: 'pointer'}}
            onClick={() => toggleEditingProperties()}
          >
            { isEditingProperties? 'Editing properties' : 'Edit properties' }
          </Text>
          <Space />
        </FlexRow>
      </PanelFooter>
    </Panel>
  )
}

component._name = 'EditNodeComponent'

const EditNode = connect(
  mapStateToProps, mapDispatchToProps)(withRebass(component))

EditNode.displayName = 'EditNodeContainer'

module.exports = EditNode
