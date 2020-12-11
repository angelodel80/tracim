import React from 'react'
import { translate } from 'react-i18next'
import { v4 as uuidv4 } from 'uuid'
import Board from '@lourenci/react-kanban'
import '@lourenci/react-kanban/dist/styles.css'
import {
  IconButton,
  PromptMessage,
  handleFetchResult,
  putFileContent,
  removeLocalStorageItem,
  getLocalStorageItem,
  setLocalStorageItem
} from 'tracim_frontend_lib'

require('./Kanban.styl')

function moveElem (array, fromPosition, toPosition, elem) {
  const a = array.slice()
  a.splice(fromPosition, 1)
  a.splice(toPosition, 0, elem)
  return a
}

export default translate()(class Kanban extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      loading: false,
      mustSave: false,
      board: {
        columns: [],
        ...JSON.parse(props.content.raw_content || '{}')
      },
      isDrafAvailable: !!getLocalStorageItem(
        'rawContent',
        props.content,
        'kanban'
      )
    }
  }

  componentDidUpdate (prevProps) {
    if (this.props.content.current_revision_id !== prevProps.content.current_revision_id) {
      // TODO handle the "Refresh?" button
      this.updateBoard({
        ...this.state.board,
        ...JSON.parse(this.props.content.raw_content || '{}')
      }, true)
    }
  }

  handleRestoreDraft = () => {
    this.updateBoard(
      JSON.parse(getLocalStorageItem('rawContent', this.props.content, 'kanban')),
      true
    )
    this.setState({ isDrafAvailable: false, mustSave: true })
  }

  handleDiscardChanges = () => {
    if (confirm(this.props.t('Are you sure you want to discard your changes?'))) {
      this.updateBoard(JSON.parse(this.props.content.raw_content || '{}'), true)
      removeLocalStorageItem('rawContent', this.props.content, 'kanban')
      this.setState({ mustSave: false, isDraftAvailable: false })
    }
  }

  handleEditCardTitle = (card) => {
    const title = prompt(this.props.t('Please enter the new title of this card'), card.title || '')
    if (title) {
      this.updateCard(card, { ...card, title })
    }
  }

  handleEditCardContent = (card) => {
    const description = prompt(this.props.t('Please enter the new content of this card'), card.description || '')
    if (description) {
      this.updateCard(card, { ...card, description })
    }
  }

  updateCard (oldCard, updatedCard) {
    this.updateColumns(
      this.state.board.columns.map(
        col => ({
          ...col,
          cards: col.cards.map(
            card => (
              oldCard === card
                ? updatedCard
                : card
            )
          )
        })
      )
    )
  }

  removeCard = (card) => {
    this.updateColumns(
      this.state.board.columns.map(
        col => ({
          ...col,
          cards: col.cards.filter(c => c !== card)
        })
      )
    )
  }

  renderCard = (card, arg2, arg3) => {
    // console.log("renderCard", card, arg2, arg3)
    return (
      <div className='file__contentpage__statewrapper__kanban__card'>
        <div className='file__contentpage__statewrapper__kanban__card__title'>
          <strong onClick={() => this.handleEditCardTitle(card)}>{card.title}</strong>
          <IconButton
            text=''
            icon='trash'
            onClick={() => this.removeCard(card)}
          />
        </div>
        <div
          className='file__contentpage__statewrapper__kanban__card__description'
          onClick={() => this.handleEditCardContent(card)}
        >
          {card.description}
        </div>
      </div>
    )
  }

  handleAddCardClicked (column) {
    const title = prompt('Please enter the title of the card')
    if (title) {
      const description = prompt('Please enter the content of the card')

      this.addCardToColumn(column, {
        id: uuidv4(),
        title,
        description
      })
    }
  }

  addCardToColumn (column, card) {
    this.updateColumns(
      this.state.board.columns.map(
        col => (
          col === column
            ? { ...col, cards: [...col.cards, card] }
            : col
        )
      )
    )
  }

  handleSaveClicked = async () => {
    const { props } = this
    const fetchResultSaveKanban = await handleFetchResult(
      await putFileContent(
        props.config.apiUrl,
        props.content.workspace_id,
        props.content.content_id,
        props.content.label,
        JSON.stringify(this.state.board)
      )
    )

    // TODO factorize with the code doing the same thing in html doc
    switch (fetchResultSaveKanban.apiResponse.status) {
      case 200: {
        removeLocalStorageItem(
          'rawContent',
          props.content,
          'kanban'
        )

        this.setState({ mustSave: false, isDrafAvailable: false })
        // TODO handle VIEW / edit mode
        // TODO handle notify all
        break
      }
      case 400:
        switch (fetchResultSaveKanban.body.code) {
          case 2044:
            alert(props.t('You must change the status or restore this kanban board before any change'))
            break
          default:
            alert(props.t('Error while saving the new version'))
            break
        }
        break
      default:
        alert(props.t('Error while saving the new version'))
        break
    }
  }

  handleAddColumnClicked = (board, column) => {
    // console.log("handleAddColumnClicked", board, column)
    const title = prompt('Please enter the name of the new column')
    if (!title) {
      return
    }

    this.handleNewColumnConfirm({
      title: title,
      cards: []
    })
  }

  handleCardRemove = (card) => {
    // console.log("handleCardRemove", card)
    this.removeCard(card)
  }

  handleColumnRemove = (column) => {
    // console.log("handleColumnRemove", column)
    this.updateColumns(this.state.board.columns.filter(col => col !== column))
  }

  handleCardDragEnd = (card, { fromColumnId, fromPosition }, { toColumnId, toPosition }) => {
    // console.log("handleCardDragEnd", card, { fromColumnId, fromPosition }, {toColumnId, toPosition })
    this.updateColumns(
      this.state.board.columns.map(
        col => (
          (col.id === fromColumnId && col.id === toColumnId)
            ? { ...col, cards: moveElem(col.cards, fromPosition, toPosition, card) }
            : (
              col.id === fromColumnId
                ? { ...col, cards: col.cards.filter(c => c !== card) }
                : (
                  col.id === toColumnId
                    ? {
                      ...col,
                      cards: [
                        ...col.cards.slice(0, toPosition),
                        card,
                        ...col.cards.slice(toPosition)
                      ]
                    }
                    : col
                )
            )
        )
      )
    )
    //     this.updateBoard(board)
  }

  handleNewColumnConfirm = (column) => {
    // console.log("handleNewColumnConfirm", column)
    const newColumn = { ...column, id: uuidv4() }

    this.updateColumns([
      ...this.state.board.columns,
      newColumn
    ])
  }

  handleColumnDragEnd = (column, { fromPosition }, { toPosition }) => {
    this.updateColumns(
      moveElem(
        this.state.board.columns,
        fromPosition,
        toPosition,
        column
      )
    )
  }

  updateColumns (newColumns) {
    this.updateBoard({ ...this.state.board, columns: newColumns })
  }

  updateBoard (newBoard, dontSaveDraftToLocalStorage) {
    this.setState({
      board: newBoard,
      mustSave: !dontSaveDraftToLocalStorage
    })

    if (!dontSaveDraftToLocalStorage) {
      setLocalStorageItem('rawContent', this.props.content, 'kanban', JSON.stringify(newBoard))
    }
  }

  handleColumnRenameClick = (column) => {
    const newName = prompt(this.props.t('Please enter the new name of the column'), column.title)
    if (newName) {
      this.handleColumnRename(column, newName)
    }
  }

  handleColumnRename = (column, title) => {
    // console.log("handleColumnRename", column, title)
    const newColumns = this.state.board.columns
    newColumns[newColumns.indexOf(column)] = { ...column, title }
    this.updateColumns(newColumns)
    return column
  }

  handleColumnNew = (board, column) => {
    // console.log("handleColumnNew", board, column)
    this.updateBoard(board)
    return column
  }

  renderColumnHeader = (column) => {
    return (
      <div className='file__contentpage__statewrapper__kanban__columnHeader'>
        <strong onClick={() => this.handleColumnRenameClick(column)}>{column.title}</strong>
        <IconButton
          text=''
          icon='plus'
          tooltip={this.props.t('Add a card')}
          onClick={() => this.handleAddCardClicked(column)}
        />
        <IconButton
          text=''
          icon='trash'
          onClick={() => this.handleColumnRemove(column)}
        />
      </div>
    )
  }

  render () {
    const { props, state } = this

    return (
      <div className='file__contentpage__statewrapper__kanban'>
        {state.isDrafAvailable && (
          <PromptMessage
            msg={props.t('You have a pending draft')}
            btnType='link'
            icon='hand-o-right'
            btnLabel={props.t('Resume writing')}
            onClickBtn={this.handleRestoreDraft}
          />
        )}

        <p>
          <div className='file__contentpage__statewrapper__kanban__toolbar'>
            <IconButton
              text={props.t('column')}
              icon='plus'
              onClick={this.handleAddColumnClicked}
            />
            <IconButton
              disabled={!state.mustSave}
              icon='save'
              text={props.t('Save')}
              onClick={this.handleSaveClicked}
            />
            <IconButton
              disabled={!state.mustSave}
              icon='trash'
              text={props.t('Discard changes')}
              onClick={this.handleDiscardChanges}
            />
          </div>
        </p>
        {state.loading && <span> Loading, please wait… </span>}
        <Board
          allowAddColumn
          allowRemoveColumn
          allowRenameColumn
          allowAddCard
          allowRemoveCard
          onCardDragEnd={this.handleCardDragEnd}
          onColumnDragEnd={this.handleColumnDragEnd}
          onNewColumnConfirm={this.handleNewColumnConfirm}
          onColumnNew={this.handleColumnNew}
          onColumnRemove={this.handleColumnRemove}
          onCardRemove={this.handleCardRemove}
          onColumnRename={this.handleColumnRename}
          renderColumnHeader={this.renderColumnHeader}
          renderCard={this.renderCard}
        >
          {state.board}
        </Board>
      </div>
    )
  }
})
