import React from 'react'
import Select from 'react-select'
import makeAnimated from 'react-select/animated'
import { handleFetchResult } from 'tracim_frontend_lib'
import { getWorkspaceMemberList } from '../../../action.async'
import { translate } from 'react-i18next'
import PropTypes from 'prop-types'

const animatedComponents = makeAnimated()

export class UsersSelectField extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      users: []
    }
  }

  componentDidMount = () => {
    this.fetchUsers().catch((r) => {
      this.sendGlobalFlashMessage('Error while fetch users')
    })
  }

  sendGlobalFlashMessage = msg => GLOBAL_dispatchEvent({
    type: 'addFlashMsg',
    data: {
      msg: msg,
      type: 'warning',
      delay: undefined
    }
  })

  fetchUsers = async () => {
    const formContext = this.props.formContext
    if (formContext.apiUrl === undefined && formContext.workspaceId === undefined) return
    const fetchUsersResponse = await handleFetchResult(await getWorkspaceMemberList(formContext.apiUrl, formContext.workspaceId))
    // const fetchUsersResponse = await handleFetchResult(await getMyselfKnownMember(formContext.apiUrl, formContext.userId))
    switch (fetchUsersResponse.apiResponse.status) {
      case 200 :
        let usersTmp = fetchUsersResponse.body.map((u) =>
          ({
            value: u.user_id,
            label: u.user.public_name
          }))
        this.setState({
          users: usersTmp
        })
        break
      default :
        this.sendGlobalFlashMessage('Error while fetch users')
        break
    }
  }

  render () {
    const p = this.props
    return (
      <div>
        <label
          className='control-label'>{p.schema.title ? p.schema.title : p.t('Title undefined')}</label>
        <Select
          isDisabled={p.disabled}
          components={animatedComponents}
          isMulti
          value={p.formData ? p.formData : ''}
          options={this.state.users}
          onChange={p.onChange}
        />
      </div>
    )
  }
}

export default translate()(UsersSelectField)

UsersSelectField.defaultProps = {
  disabled: false,
  formContext: {}
}

UsersSelectField.propType = {
  onChange: PropTypes.func,
  schema: PropTypes.object,
  formData: PropTypes.object,
  disabled: PropTypes.bool,
  formContext: PropTypes.object
}