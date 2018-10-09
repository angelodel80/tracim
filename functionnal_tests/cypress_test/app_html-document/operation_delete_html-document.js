import { login } from '../helpers/index.js'

describe('operation :: workspace > delete > html-document', function () {
    before(function () {
        login(cy)
    })
    after(function() {
        cy.get('#dropdownMenuButton').click()
        cy.get('div.setting__link').click()
        cy.url().should('include', '/login')
    })
    it ('all content > html-document > delete first html-doc', function(){
        var titre1='dashboard button html'
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').should('have.attr', 'aria-hidden', 'false').should('be.visible')
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').should('have.attr', 'aria-hidden', 'false').click()
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('.content__name__text').contains(titre1).should('be.visible')
        cy.get('.content__name__text').contains(titre1).click()
        cy.get('.html-document.visible').should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre1)
        cy.get('.align-items-center button:nth-child(2)').click()
        cy.get('.html-document__contentpage__textnote__state__btnrestore').should('be.visible')
        cy.get('.html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
//    })
//    it ('all content > html-document > delete second html-doc', function(){
        var titre2='all content button html'
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').should('have.attr', 'aria-hidden', 'false').should('be.visible')
        cy.get('.sidebar__content__navigation__workspace__item__submenu > li:nth-child(2)').should('have.attr', 'aria-hidden', 'false').click()
        cy.get('.pageTitleGeneric__title__icon').should('be.visible')
        cy.get('.content__name__text').contains(titre2).should('be.visible')
        cy.get('.content__name__text').contains(titre2).click()
        cy.get('.html-document.visible').should('be.visible')
        cy.get('.html-document.visible .wsContentGeneric__header__title').contains(titre2)
        cy.get('.align-items-center button:nth-child(2)').click()
        cy.get('.html-document__contentpage__textnote__state__btnrestore').should('be.visible')
        cy.get('.html-document__header__close').click()
        cy.get('.html-document.visible').should('not.be.visible')
    })
})